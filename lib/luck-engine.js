/**
 * 命理今日 · 算法引擎（精简自 LuckCraft）
 *
 * 依赖：window.Lunar / window.Solar (vendor/lunar.js · UMD 全局变量)
 * 存储：localStorage（替代原 fs）
 *
 * 暴露：window.LuckEngine = { compute, drawTarot, sign, getState, ... }
 */

(function (root) {
  'use strict';

  /* ━━━━━━━━━━ 1. 常量与映射 ━━━━━━━━━━ */
  const TIANGAN_WUXING = {
    '甲': '木', '乙': '木', '丙': '火', '丁': '火',
    '戊': '土', '己': '土', '庚': '金', '辛': '金',
    '壬': '水', '癸': '水'
  };
  const TIANGAN_YINYANG = { '甲': '阳', '乙': '阴', '丙': '阳', '丁': '阴', '戊': '阳', '己': '阴', '庚': '阳', '辛': '阴', '壬': '阳', '癸': '阴' };
  const DIZHI_WUXING = {
    '子': '水', '丑': '土', '寅': '木', '卯': '木',
    '辰': '土', '巳': '火', '午': '火', '未': '土',
    '申': '金', '酉': '金', '戌': '土', '亥': '水'
  };
  const DIZHI_HOUR = {
    '子': [23, 1], '丑': [1, 3], '寅': [3, 5], '卯': [5, 7],
    '辰': [7, 9], '巳': [9, 11], '午': [11, 13], '未': [13, 15],
    '申': [15, 17], '酉': [17, 19], '戌': [19, 21], '亥': [21, 23]
  };
  const HOUR_TO_DIZHI = {};
  Object.entries(DIZHI_HOUR).forEach(([zhi, [s, e]]) => {
    if (s > e) { for (let h = s; h < 24; h++) HOUR_TO_DIZHI[h] = zhi; for (let h = 0; h < e; h++) HOUR_TO_DIZHI[h] = zhi; }
    else { for (let h = s; h < e; h++) HOUR_TO_DIZHI[h] = zhi; }
  });
  const SHENGXIAO = { '子': '鼠', '丑': '牛', '寅': '虎', '卯': '兔', '辰': '龙', '巳': '蛇', '午': '马', '未': '羊', '申': '猴', '酉': '鸡', '戌': '狗', '亥': '猪' };

  // 五行生克
  const WX_SHENG = { '木': '火', '火': '土', '土': '金', '金': '水', '水': '木' };
  const WX_KE    = { '木': '土', '土': '水', '水': '火', '火': '金', '金': '木' };

  // 十神（日干 → 其他天干 → 十神名）
  function getShiShen(dayGan, otherGan) {
    if (!dayGan || !otherGan) return null;
    const dWx = TIANGAN_WUXING[dayGan], oWx = TIANGAN_WUXING[otherGan];
    const dYY = TIANGAN_YINYANG[dayGan], oYY = TIANGAN_YINYANG[otherGan];
    const same = dYY === oYY;
    if (dWx === oWx) return same ? '比肩' : '劫财';
    if (WX_SHENG[dWx] === oWx) return same ? '食神' : '伤官';
    if (WX_KE[dWx] === oWx) return same ? '偏财' : '正财';
    if (WX_KE[oWx] === dWx) return same ? '七杀' : '正官';
    if (WX_SHENG[oWx] === dWx) return same ? '偏印' : '正印';
    return null;
  }

  // 十神主题映射
  const SHISHEN_THEME = {
    '比肩': { theme: '协作与坚守', goodFor: ['和同事并肩推进项目', '维系老朋友', '健身/运动'], watchOut: ['别和人比较', '注意花销'], scene: '今天适合团队协作场景，自己单打独斗不如借力。' },
    '劫财': { theme: '行动与冒险', goodFor: ['果断处理拖延事项', '主动联系老客户', '尝试新方法'], watchOut: ['控制冲动消费', '小心争执'], scene: '今天能量足，但要小心因为太冲被人误解。' },
    '食神': { theme: '创意与享受', goodFor: ['头脑风暴/写文案', '美食分享', '陪伴重要的人'], watchOut: ['别太懒', '注意饮食克制'], scene: '今天适合做让自己开心的工作，享受过程比结果重要。' },
    '伤官': { theme: '突破与表达', goodFor: ['提出新点子', '做演示/分享', '艺术创作'], watchOut: ['说话注意分寸', '别和上级硬碰硬'], scene: '今天表达欲强，适合展示作品但要注意场合。' },
    '偏财': { theme: '机会与人脉', goodFor: ['拓展人脉', '副业推进', '小额投资研究'], watchOut: ['别冲动消费', '警惕投机'], scene: '今天财气流动，适合谈合作和拓展人脉。' },
    '正财': { theme: '务实与积累', goodFor: ['处理财务/记账', '做计划做预算', '稳扎稳打的工作'], watchOut: ['避免冒险投资', '别拖延正事'], scene: '今天适合做"踏实事"，不适合冒险或谈大单。' },
    '七杀': { theme: '攻坚与压力', goodFor: ['啃硬骨头任务', '处理棘手问题', '高强度训练'], watchOut: ['注意健康', '避免冲突', '管好情绪'], scene: '今天压力较大，但也是攻克难关的好时机。' },
    '正官': { theme: '规范与晋升', goodFor: ['向上汇报', '参加正式会议', '按流程办事'], watchOut: ['别打擦边球', '别给人不靠谱印象'], scene: '今天适合正式场合——汇报、评审、签合同。' },
    '偏印': { theme: '深度与孤独', goodFor: ['深度学习', '研究/钻研', '独处复盘'], watchOut: ['别多想', '别陷入纠结'], scene: '今天适合一个人静下来思考，不适合社交派对。' },
    '正印': { theme: '滋养与学习', goodFor: ['看书/上课', '请教前辈', '陪父母'], watchOut: ['别太依赖别人', '注意作息'], scene: '今天适合学习和被照顾，主动请教会有收获。' }
  };

  // 五行 → 颜色 / 饰品 / 食物 / 数字 / 方位
  const WX_COLORS = {
    '金': { lucky: ['白色', '银色', '金色'], items: ['白衬衫', '银灰针织'], advice: '宜穿白银色系 · 干练利落' },
    '木': { lucky: ['绿色', '青色', '翠色'], items: ['墨绿衬衫', '橄榄绿外套'], advice: '宜穿绿色系 · 生机成长' },
    '水': { lucky: ['黑色', '深蓝', '藏青'], items: ['藏青西装', '深蓝衬衫'], advice: '宜穿深色系 · 沉稳内敛' },
    '火': { lucky: ['红色', '紫色', '橙色'], items: ['酒红领带', '紫色配饰'], advice: '宜点缀暖色 · 提升气场' },
    '土': { lucky: ['黄色', '棕色', '米色'], items: ['驼色风衣', '米色针织'], advice: '宜穿大地色 · 可靠稳重' }
  };
  const WX_ACCESSORIES = {
    '金': ['白水晶', '银饰', '钛钢'],
    '木': ['绿幽灵', '青金石', '木珠'],
    '水': ['黑曜石', '蓝宝石', '海蓝宝'],
    '火': ['红玛瑙', '石榴石', '紫水晶'],
    '土': ['黄水晶', '虎眼石', '黄玉']
  };
  const WX_FOODS = {
    '金': ['白萝卜山药排骨汤', '清蒸鲈鱼', '银耳百合羹', '白斩鸡'],
    '木': ['酸汤肥牛', '芹菜炒肉', '西兰花虾仁', '越式牛肉粉'],
    '水': ['海带豆腐汤', '黑芝麻糊', '鲍鱼粥', '紫菜蛋花汤'],
    '火': ['红焖羊肉', '番茄牛腩', '辣子鸡丁', '麻辣香锅'],
    '土': ['南瓜小米粥', '土豆牛肉', '黄焖鸡米饭', '红薯炖排骨']
  };
  const WX_DRINKS = { '金': '白茶 / 雪梨银耳汤', '木': '绿茶 / 柠檬水', '水': '黑咖 / 矿泉水', '火': '红茶 / 桂花酒酿', '土': '南瓜拿铁 / 玉米汁' };
  const WX_NUMBERS = { '金': [4, 9], '木': [3, 8], '水': [1, 6], '火': [2, 7], '土': [5, 0] };
  const WX_DIRECTION = { '金': '正西', '木': '正东', '水': '正北', '火': '正南', '土': '中宫/东北/西南' };

  /* ━━━━━━━━━━ 2. 八字与今日 ━━━━━━━━━━ */
  function calcBazi(year, month, day, hour) {
    const Solar = root.Solar;
    if (!Solar) throw new Error('lunar.js 未加载');
    const lunar = Solar.fromYmdHms(year, month, day, hour, 0, 0).getLunar();
    const ec = lunar.getEightChar();
    const four = {
      yearGan: ec.getYearGan(), yearZhi: ec.getYearZhi(),
      monthGan: ec.getMonthGan(), monthZhi: ec.getMonthZhi(),
      dayGan: ec.getDayGan(), dayZhi: ec.getDayZhi(),
      timeGan: ec.getTimeGan(), timeZhi: ec.getTimeZhi()
    };
    // 五行计数
    const wxCount = { 金: 0, 木: 0, 水: 0, 火: 0, 土: 0 };
    [four.yearGan, four.monthGan, four.dayGan, four.timeGan].forEach(g => { wxCount[TIANGAN_WUXING[g]] += 1; });
    [four.yearZhi, four.monthZhi, four.dayZhi, four.timeZhi].forEach(z => { wxCount[DIZHI_WUXING[z]] += 1; });

    // 调候用神（极简：以月支季节判断）
    const yong = calcTiaohuoYongShen(four.monthZhi, four.dayGan);

    return {
      fourPillars: `${four.yearGan}${four.yearZhi} ${four.monthGan}${four.monthZhi} ${four.dayGan}${four.dayZhi} ${four.timeGan}${four.timeZhi}`,
      ...four,
      wxCount,
      yongShen: yong.primary,
      yongShenSecondary: yong.secondary,
      yongShenReason: yong.reason,
      shengXiao: SHENGXIAO[four.yearZhi]
    };
  }

  function calcTiaohuoYongShen(monthZhi, dayGan) {
    // 简化调候：按月支季节 + 日干粗判
    const seasonMap = {
      '亥子丑': { primary: '火', secondary: '木', reason: '冬月需火暖局' },
      '巳午未': { primary: '水', secondary: '金', reason: '夏月需水润局' },
      '寅卯辰': { primary: '金', secondary: '火', reason: '春月木旺需金制' },
      '申酉戌': { primary: '火', secondary: '木', reason: '秋月金旺需火炼' }
    };
    for (const [zhis, val] of Object.entries(seasonMap)) {
      if (zhis.includes(monthZhi)) return val;
    }
    return { primary: '土', secondary: '火', reason: '中和取土' };
  }

  function getTodayPillars(now) {
    now = now || new Date();
    const Solar = root.Solar;
    const sol = Solar.fromYmdHms(now.getFullYear(), now.getMonth() + 1, now.getDate(), now.getHours(), now.getMinutes(), now.getSeconds());
    const lunar = sol.getLunar();
    return {
      yearGan: lunar.getYearGan(), yearZhi: lunar.getYearZhi(),
      monthGan: lunar.getMonthGan(), monthZhi: lunar.getMonthZhi(),
      dayGan: lunar.getDayGan(), dayZhi: lunar.getDayZhi(),
      timeGan: lunar.getTimeGan(), timeZhi: lunar.getTimeZhi(),
      lunarDate: `${lunar.getYearInGanZhi()}年 ${lunar.getMonthInChinese()}月 ${lunar.getDayInChinese()}`,
      animal: SHENGXIAO[lunar.getDayZhi()],
      jieQi: lunar.getJieQi() || null,
      currentJieQi: lunar.getCurrentJieQi ? (lunar.getCurrentJieQi() && lunar.getCurrentJieQi().getName()) : null
    };
  }

  /* ━━━━━━━━━━ 3. 时辰吉门（简化奇门） ━━━━━━━━━━ */
  // 八门按"吉-凶-吉-中-吉-中-凶-吉"交错排序，让一天散开
  const EIGHT_GATES = ['开门', '伤门', '生门', '杜门', '休门', '景门', '死门', '惊门'];
  const GATE_INFO = {
    '开门': { luck: '大吉', advice: '适合开启新任务、谈合作', plain: '能量打开了 · 想做的事就开始',         tag: '吉' },
    '休门': { luck: '吉',   advice: '适合休息调整、复盘',     plain: '该歇就歇 · 给自己充电',            tag: '✦' },
    '生门': { luck: '大吉', advice: '适合学习新技能、谈生意', plain: '生发力强 · 学新东西 · 拓展圈子',    tag: '吉' },
    '伤门': { luck: '凶',   advice: '不宜重大决策',           plain: '容易上头 · 说话做事先深呼吸',        tag: '警' },
    '杜门': { luck: '中',   advice: '适合专注独处、研究',     plain: '关上门做自己的事 · 别社交',          tag: '·' },
    '景门': { luck: '中',   advice: '适合写报告、提案',       plain: '适合脑力活 · 写东西 · 做方案',      tag: '·' },
    '死门': { luck: '大凶', advice: '不宜出行、重大安排',     plain: '能量低 · 别开始大事 · 避开重要决定', tag: '⛔' },
    '惊门': { luck: '凶',   advice: '保持警觉、防意外',       plain: '会有突发 · 留点时间应变',            tag: '警' }
  };
  const ZHI_ORDER = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];

  function get12HourGates(todayDayGan) {
    // 以日干为种子起点，循环 12 次取门，再按 fixed 轮换偏移避免连凶
    const seed = '甲乙丙丁戊己庚辛壬癸'.indexOf(todayDayGan);
    return ZHI_ORDER.map((zhi, i) => {
      const gate = EIGHT_GATES[(i * 5 + seed * 3) % 8]; // 步长 5 与 8 互质 · 12 时辰循环必经过所有 8 门 · 至少 4 吉
      return {
        zhi,
        hourRange: DIZHI_HOUR[zhi],
        gate,
        ...GATE_INFO[gate]
      };
    });
  }

  // 个性化时辰提示：时辰地支五行 × 个人日干五行
  function addPersonalHints(gates, userBazi) {
    if (!userBazi || !userBazi.dayGan) return gates;
    const myWx = TIANGAN_WUXING[userBazi.dayGan];
    if (!myWx) return gates;
    return gates.map(g => {
      const hourWx = DIZHI_WUXING[g.zhi];
      let personalTag = '';
      let personalHint = '';
      let personalLevel = 0;   // -2 ~ +2
      if (hourWx === myWx) {
        personalTag = '同气';  personalLevel = 1;
        personalHint = `时辰${hourWx}与你${myWx}同气 · 精力最足 · 重要事务首选`;
      } else if (WX_SHENG[hourWx] === myWx) {
        personalTag = '生身';  personalLevel = 2;
        personalHint = `时辰${hourWx}生扶你${myWx} · 吸收学习/被滋养最佳`;
      } else if (WX_SHENG[myWx] === hourWx) {
        personalTag = '泄身';  personalLevel = -1;
        personalHint = `你${myWx}在此时泄出能量 · 适合表达输出 · 但注意别透支`;
      } else if (WX_KE[hourWx] === myWx) {
        personalTag = '克身';  personalLevel = -2;
        personalHint = `时辰${hourWx}克你${myWx} · 避免硬碰硬 · 柔性处理`;
      } else if (WX_KE[myWx] === hourWx) {
        personalTag = '胜出';  personalLevel = 1;
        personalHint = `你${myWx}主动克${hourWx} · 主动出击效果好 · 但耗能`;
      }
      return { ...g, personalTag, personalHint, personalLevel };
    });
  }

  function getCurrentHourEntry(gates, now) {
    now = now || new Date();
    const h = now.getHours();
    const zhi = HOUR_TO_DIZHI[h];
    return gates.find(g => g.zhi === zhi);
  }

  // 下一个吉门倒计时
  function getNextGoodGate(gates, now) {
    now = now || new Date();
    const h = now.getHours(), m = now.getMinutes(), s = now.getSeconds();
    const todayMinutes = h * 60 + m + s / 60;
    const goodList = gates.filter(g => g.luck === '吉' || g.luck === '大吉');
    let best = null, bestDiff = Infinity;
    goodList.forEach(g => {
      const [start] = g.hourRange;
      const startMin = start * 60;
      // 跨午夜处理
      let diff = startMin - todayMinutes;
      if (diff <= 0) diff += 24 * 60;
      if (diff < bestDiff) { bestDiff = diff; best = g; }
    });
    return { gate: best, minutesLeft: bestDiff };
  }

  /* ━━━━━━━━━━ 4. 九宫飞星（简化版日飞星） ━━━━━━━━━━ */
  const FEIXING_INFO = {
    1: { name: '一白贪狼', luck: '吉', dir: '北', desc: '桃花/人缘', adv: '安排社交活动' },
    2: { name: '二黑病符', luck: '凶', dir: '西南', desc: '病符', adv: '避免久留' },
    3: { name: '三碧禄存', luck: '凶', dir: '东', desc: '是非口舌', adv: '少争辩' },
    4: { name: '四绿文曲', luck: '吉', dir: '东南', desc: '文昌学术', adv: '学习写作' },
    5: { name: '五黄廉贞', luck: '大凶', dir: '中宫', desc: '灾星', adv: '务必避开' },
    6: { name: '六白武曲', luck: '吉', dir: '西北', desc: '贵人/权力', adv: '求贵人' },
    7: { name: '七赤破军', luck: '凶', dir: '西', desc: '小人破财', adv: '保密' },
    8: { name: '八白左辅', luck: '大吉', dir: '东北', desc: '财星事业', adv: '求财谈生意' },
    9: { name: '九紫右弼', luck: '吉', dir: '南', desc: '喜庆桃花', adv: '宜表白宴客' }
  };
  function calcDayFeixing(now) {
    now = now || new Date();
    // 简化：以儒略日 % 9 算中宫
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const epoch = new Date(2000, 0, 1);
    const days = Math.floor((d - epoch) / 86400000);
    const center = ((days % 9) + 9) % 9 + 1; // 1-9
    return {
      center,
      centerInfo: FEIXING_INFO[center],
      bestDir: FEIXING_INFO[8].dir,
      worstDir: FEIXING_INFO[5].dir
    };
  }

  /* ━━━━━━━━━━ 5. 十神流日 ━━━━━━━━━━ */
  function calcTodayTheme(userBazi, today) {
    const shi = getShiShen(userBazi.dayGan, today.dayGan);
    const info = SHISHEN_THEME[shi] || SHISHEN_THEME['正官'];
    return { shiShen: shi, ...info };
  }

  /* ━━━━━━━━━━ 6. 黄历宜忌（基于十神 + 用神） ━━━━━━━━━━ */
  function calcYiJi(theme, userBazi, today) {
    // 宜：取十神 goodFor 前 3 + 用神匹配 1
    const yi = (theme.goodFor || []).slice(0, 3);
    const yongMatch = userBazi.yongShen;
    const todayDayWx = TIANGAN_WUXING[today.dayGan];
    if (todayDayWx === yongMatch) yi.push('用神当值 · 抓住机遇');
    // 忌：取十神 watchOut 前 2
    const ji = (theme.watchOut || []).slice(0, 2);
    if (todayDayWx === WX_KE[yongMatch]) ji.push('日克用神 · 重大决策推迟');
    return { yi, ji };
  }

  /* ━━━━━━━━━━ 7. 四维好运分（事业/财运/社交/健康） ━━━━━━━━━━ */
  // 确定性小哈希 · 同 seed 永远得同结果（替代 Math.random · 避免刷新跳变）
  function stableHash(str) {
    let h = 0;
    for (let i = 0; i < str.length; i++) h = ((h * 31) + str.charCodeAt(i)) | 0;
    return Math.abs(h);
  }
  function calcFourDimensions(theme, userBazi, today, seed) {
    const todayWx = TIANGAN_WUXING[today.dayGan];
    const yong = userBazi.yongShen;
    // 基础分的来源
    let baseReason;
    let base;
    if (todayWx === yong) {
      base = 80; baseReason = `流日${todayWx} = 你用神${yong} · 基底分 80`;
    } else if (todayWx === WX_SHENG[yong]) {
      base = 70; baseReason = `流日${todayWx}生你用神${yong} · 基底分 70`;
    } else if (todayWx === WX_KE[yong]) {
      base = 35; baseReason = `流日${todayWx}克你用神${yong} · 基底分 35`;
    } else {
      base = 55; baseReason = `流日${todayWx}与你用神${yong}中性 · 基底分 55`;
    }
    // 不同十神在不同维度加权
    const weights = {
      '正官': { 事业: 1.2, 财运: 1.0, 社交: 0.9, 健康: 0.85 },
      '七杀': { 事业: 1.1, 财运: 0.95, 社交: 0.8, 健康: 0.7 },
      '正财': { 事业: 1.0, 财运: 1.25, 社交: 0.95, 健康: 0.95 },
      '偏财': { 事业: 0.95, 财运: 1.2, 社交: 1.15, 健康: 0.9 },
      '食神': { 事业: 0.95, 财运: 1.0, 社交: 1.1, 健康: 1.15 },
      '伤官': { 事业: 1.0, 财运: 1.0, 社交: 1.15, 健康: 0.85 },
      '比肩': { 事业: 1.0, 财运: 0.9, 社交: 1.1, 健康: 1.05 },
      '劫财': { 事业: 0.95, 财运: 0.8, 社交: 1.05, 健康: 0.95 },
      '正印': { 事业: 1.05, 财运: 0.9, 社交: 0.95, 健康: 1.2 },
      '偏印': { 事业: 1.0, 财运: 0.9, 社交: 0.85, 健康: 1.1 }
    };
    const w = weights[theme.shiShen] || weights['正官'];
    const dim = {};
    const breakdown = {};          // 新：每个维度的分数拆解
    Object.entries(w).forEach(([k, v]) => {
      const jitter = seed
        ? (stableHash(`${seed}-${k}`) % 9) - 4
        : (Math.random() * 8 - 4);
      const raw = base * v + jitter;
      const final = Math.max(20, Math.min(95, Math.round(raw)));
      dim[k] = final;
      // 拆解：公式、权重来源、最终分
      breakdown[k] = {
        base,
        baseReason,
        weight: v,
        weightReason: `${theme.shiShen}日 · ${k}加权 ×${v}`,
        jitter,
        formula: `${base} × ${v.toFixed(2)} ${jitter >= 0 ? '+' : ''}${Math.round(jitter)} = ${final}`,
        tone: v >= 1.1 ? '强' : v >= 0.95 ? '中' : '弱'
      };
    });
    // 附加 breakdown 到返回（用 defineProperty · 不会被 Object.entries 枚举）
    Object.defineProperty(dim, '_breakdown', { value: breakdown, enumerable: false });
    Object.defineProperty(dim, '_baseReason', { value: baseReason, enumerable: false });
    return dim;
  }

  /* ━━━━━━━━━━ 8. 趋吉行动建议（L3 算法 · 多因子 + 日干分化） ━━━━━━━━━━ */
  //
  // 输入变量（5 因子）：
  //   1. userBazi.yongShen      调候用神（按月支季节）
  //   2. userBazi.dayGan        日干（个人主气 · 关键分化因子）
  //   3. userBazi.wxCount       五行缺口（1~4 柱的五行统计）
  //   4. today.dayGan/dayZhi    流日干支（今日能量）
  //   5. feixing.bestDir        今日九宫飞星最吉位
  //
  // 决策逻辑：
  //   a) 找出"今日目标五行"：
  //      - 若流日五行 === 调候用神 → 顺势强化（目标 = 用神）
  //      - 若流日克调候用神       → 转向日干需要补的方向
  //      - 其他情况              → 目标 = 调候用神
  //   b) 每个字段（颜色/数字/食物/方位/饰品）根据"目标五行" + 抖动种子选
  //   c) 抖动种子 = userId + dayGanzhi · 同人同日稳定
  //
  // 牛嘻分化关键：日干不同（乙木 vs 丙火）→ 个人缺口不同 → 流日影响不同 → 推荐不同

  // 简易 hash（只在这个模块内用）
  function _hashSeed(str) {
    let h = 0;
    for (let i = 0; i < str.length; i++) h = ((h * 31) + str.charCodeAt(i)) | 0;
    return Math.abs(h);
  }

  // 根据 wxCount 找"最缺的 2 个五行"（不含用神本身）
  function _rankDeficits(wxCount, yong) {
    const wxs = ['金', '木', '水', '火', '土'];
    return wxs
      .filter(wx => wx !== yong)
      .map(wx => ({ wx, cnt: wxCount[wx] || 0 }))
      .sort((a, b) => a.cnt - b.cnt)  // 升序：最少的在前
      .map(x => x.wx);
  }

  // 从数组里用 seed 确定性选 N 个（不重复）
  function _pickN(arr, n, seed) {
    if (!arr || arr.length === 0) return [];
    if (n >= arr.length) return arr.slice();
    const shuffled = arr
      .map((v, i) => ({ v, sort: _hashSeed(seed + '_' + i) }))
      .sort((a, b) => a.sort - b.sort)
      .map(x => x.v);
    return shuffled.slice(0, n);
  }

  function calcRecommendations(userBazi, today, feixing, userId) {
    const yong = userBazi.yongShen;                           // 个人调候用神
    const dayGan = userBazi.dayGan;                           // 个人日干
    const dayGanWx = TIANGAN_WUXING[dayGan];                  // 个人日干五行
    const todayWx = TIANGAN_WUXING[today.dayGan];             // 今日日干五行
    const todayZhiWx = DIZHI_WUXING[today.dayZhi];            // 今日日支五行
    const deficits = _rankDeficits(userBazi.wxCount || {}, yong);
    const mostLacking = deficits[0];                          // 最缺的（非用神）

    // a) 今日目标五行（主轴）
    let targetWx;
    let reasonTag;
    if (todayWx === yong) {
      targetWx = yong;
      reasonTag = '流日合用神 · 顺势强化';
    } else if (WX_KE[todayWx] === yong) {
      targetWx = mostLacking || yong;
      reasonTag = '流日克用神 · 转向备选' + (mostLacking || yong);
    } else if (WX_SHENG[yong] === todayWx) {
      targetWx = yong;
      reasonTag = '流日生用神 · 维持本色';
    } else if (WX_KE[yong] === todayWx) {
      targetWx = yong;
      reasonTag = '用神克流日 · 强势巩固';
    } else {
      targetWx = yong;
      reasonTag = '流日中性 · 守用神';
    }

    // b) 副轴五行：在主轴之外再选 1 个"个人专属"偏好
    //    以日干五行为优先 · 若日干 === 用神（主轴），则用第二缺
    let subWx;
    if (dayGanWx !== targetWx) {
      subWx = dayGanWx;  // 牛牛=木 · 嘻嘻=火 · 分化开了
    } else {
      subWx = deficits[0] && deficits[0] !== targetWx ? deficits[0] : deficits[1];
    }
    if (!subWx || !WX_COLORS[subWx]) subWx = targetWx;

    // c) 种子：同人同日稳定（含 userId 保证牛嘻不同）
    const seed = `${userId || dayGan}-${today.dayGan}${today.dayZhi}-${targetWx}-${subWx}`;

    // d) 颜色 = 主池 1 + 副池 1（混合五行 · 让牛嘻天然不同）
    const mainColorPool = WX_COLORS[targetWx];
    const subColorPool = WX_COLORS[subWx];
    const mainColor = mainColorPool.lucky[_hashSeed(seed + 'mc') % mainColorPool.lucky.length];
    const subColor = subColorPool.lucky[_hashSeed(seed + 'sc') % subColorPool.lucky.length];
    const colors = subWx === targetWx ? [mainColor, mainColorPool.lucky[1] || mainColor] : [mainColor, subColor];
    const colorItems = [
      mainColorPool.items[_hashSeed(seed + 'mi') % mainColorPool.items.length],
      subColorPool.items[_hashSeed(seed + 'si') % subColorPool.items.length]
    ];

    // e) 饰品：主 + 副（2 件推荐）
    const mainAccPool = WX_ACCESSORIES[targetWx] || [];
    const subAccPool = WX_ACCESSORIES[subWx] || [];
    const accessory = mainAccPool[_hashSeed(seed + 'ma') % Math.max(1, mainAccPool.length)] || '';
    const accessoryAlt = subAccPool[_hashSeed(seed + 'sa') % Math.max(1, subAccPool.length)] || '';

    // f) 饮食：主池 1 + 副池 1 = 2 道主食混搭
    const mainFoodPool = WX_FOODS[targetWx] || [];
    const subFoodPool = WX_FOODS[subWx] || [];
    const foods = subWx === targetWx
      ? _pickN(mainFoodPool, 2, seed + 'f')
      : [
          mainFoodPool[_hashSeed(seed + 'mf') % Math.max(1, mainFoodPool.length)],
          subFoodPool[_hashSeed(seed + 'sf') % Math.max(1, subFoodPool.length)]
        ];
    const drink = WX_DRINKS[targetWx];

    // g) 数字：主五行的数字（不变）
    const numbers = WX_NUMBERS[targetWx];

    // h) 方位：主五行方位
    const direction = WX_DIRECTION[targetWx];

    // i) 忌：克目标五行的色/方
    const avoidWx = WX_KE[targetWx];
    const avoidColors = WX_COLORS[avoidWx] ? WX_COLORS[avoidWx].lucky.slice(0, 2) : [];

    // j) 5 个子模块
    const avoidList = _genAvoidList(targetWx, avoidWx, today, seed, dayGanWx);
    const wellness = _genWellness(targetWx, dayGanWx, seed);
    const helper = _genHelper(dayGan, today, userBazi, seed);
    const home = _genHome(targetWx, subWx, avoidWx, seed, dayGanWx);
    const speech = _genSpeech(dayGanWx, todayWx, today, seed);

    return {
      colors,
      colorsAdvice: mainColorPool.advice,
      colorItems,
      accessory,
      accessoryAlt,
      direction,
      bestDir: feixing.bestDir,
      worstDir: feixing.worstDir,
      numbers,
      foods,
      drink,
      targetWx,
      subWx,              // 新增：副轴五行（个人日干五行）
      reasonTag,
      avoid: { colors: avoidColors, dir: feixing.worstDir, wx: avoidWx },
      // 新增 5 个子模块
      avoidList,          // 🚫 今日避坑清单
      wellness,           // 💪 健身/饮水/作息
      helper,             // 👥 贵人/属相
      home,               // 🏠 居家布局
      speech              // 🗣 说话建议
    };
  }

  /* ━━━━━━━━━━ 8.1 5 个子模块生成器 ━━━━━━━━━━ */

  // 🚫 避坑清单
  // 输入：targetWx（今日目标五行）· avoidWx（今日忌五行）· today · dayGanWx（个人日干五行）
  // 输出 3 条：1 条【个人易犯】+ 1 条【今日流日】+ 1 条【通用调养】
  function _genAvoidList(targetWx, avoidWx, today, seed, dayGanWx) {
    // 每种五行日主"容易犯"的坑（人格弱点）
    const ganPersonalAvoid = {
      '水': '今天特别容易想太多 · 少刷评论区 · 别陷入信息漩涡',
      '火': '今天特别容易一时冲动 · 重大回复先晾 30 分钟再发',
      '木': '今天特别容易揽活上身 · 拒绝一个不属于你的请求',
      '金': '今天特别容易钻牛角尖 · 想不通先睡 · 明天再看',
      '土': '今天特别容易拖延 · 挑一件先启动 · 不求完美'
    };
    // 今日流日五行 · 提醒
    const todayWx = TIANGAN_WUXING[today.dayGan];
    const todayDangerMap = {
      '水': '今日水旺 · 少饮冰 · 别冒雨久站',
      '火': '今日火旺 · 避开烈日 · 别上火话题',
      '木': '今日木旺 · 少往人多地方挤 · 眼睛要休息',
      '金': '今日金旺 · 别讲重话 · 注意呼吸系统',
      '土': '今日土旺 · 别贪凉 · 少赶行程'
    };
    // 通用调养（按避忌五行）
    const wxAvoids = {
      '水': ['别熬夜透支', '避免重大决策在 11 点前做', '忌食过咸/大酒'],
      '火': ['别当面顶撞人', '避免高温暴晒/剧烈运动', '忌情绪化决定'],
      '木': ['别签多年期合同', '避免风大地方久站', '忌过度劳累肝胆'],
      '金': ['别空腹高强度', '避免长时间空调', '忌大悲/过度追忆'],
      '土': ['别过度思虑', '避免湿重环境久坐', '忌饮食过杂']
    };
    const list = [];
    // 1) 个人易犯（因 dayGanWx 不同 · 这里自然分化）
    if (dayGanWx && ganPersonalAvoid[dayGanWx]) list.push(ganPersonalAvoid[dayGanWx]);
    // 2) 流日
    if (todayDangerMap[todayWx]) list.push(todayDangerMap[todayWx]);
    // 3) 通用调养（用 avoidWx 的第一条）
    const pool = wxAvoids[avoidWx] || [];
    if (pool[0]) list.push(pool[0]);
    return list.slice(0, 3);
  }

  // 💪 健身饮水作息
  // 分双层：
  //   - 体质建议：按个人日干五行（长期 · 牛嘻分化）
  //   - 今日建议：按今日目标五行（短期 · 调养）
  function _genWellness(targetWx, dayGanWx, seed) {
    // 体质类（长期按人 · 分化）
    const ganBody = {
      '水': { type: '水型 · 偏阴', tip: '少熬夜 · 泡脚 15 分钟助睡眠' },
      '火': { type: '火型 · 偏阳', tip: '避免大汗 · 多饮温水降心火' },
      '木': { type: '木型 · 偏舒展', tip: '多伸展 · 避免长时间久坐压迫肝胆' },
      '金': { type: '金型 · 偏内敛', tip: '注意呼吸 · 深吸气慢呼气调肺' },
      '土': { type: '土型 · 偏稳重', tip: '别贪凉别贪甜 · 脾胃最怕寒湿' }
    };
    // 今日调养（按今日目标五行 · 短期）
    const wxAdvice = {
      '水': { drink: '今日多饮温水 · 8 点前 300ml · 午后 500ml', move: '瑜伽/游泳/慢走 · 柔性运动最补', sleep: '11 点前睡 · 今天少看蓝光' },
      '火': { drink: '避冰饮 · 常温白开或金银花茶', move: '有氧 30 分钟排火 · 别剧烈', sleep: '11-12 点睡 · 卧室宜暗凉' },
      '木': { drink: '早晨温水+柠檬 · 助肝胆排毒', move: '拉伸/散步/骑行 · 木气需舒展', sleep: '10 点半前睡 · 肝胆修复' },
      '金': { drink: '温润饮品 · 雪梨银耳/白茶', move: '呼吸练习/快走 · 避过度出汗', sleep: '11 点睡 · 侧睡助肺气' },
      '土': { drink: '温水+山药/小米粥 · 稳脾胃', move: '平地走/太极/小强度器械', sleep: '10 点半睡 · 脾胃修复时段' }
    };
    const today = wxAdvice[targetWx] || wxAdvice['水'];
    const body = ganBody[dayGanWx] || ganBody['水'];
    return {
      bodyType: body.type,        // 新：体质标签（牛=木型/嘻=火型）
      bodyTip: body.tip,          // 新：体质长期建议（分化）
      drink: today.drink,         // 今日饮水（可能同）
      move: today.move,           // 今日运动
      sleep: today.sleep          // 今日睡眠
    };
  }

  // 👥 贵人/属相
  function _genHelper(dayGan, today, userBazi, seed) {
    // 日干 → 最有利的生肖
    const ganToBenefit = {
      '甲': ['羊', '猪'],     // 甲木喜水木土
      '乙': ['猪', '鼠'],     // 乙木需水
      '丙': ['马', '虎'],     // 丙火同气
      '丁': ['鼠', '虎'],
      '戊': ['马', '蛇'],
      '己': ['羊', '牛'],
      '庚': ['鸡', '猴'],
      '辛': ['猴', '猪'],
      '壬': ['龙', '马'],
      '癸': ['牛', '猴']
    };
    const benefit = ganToBenefit[dayGan] || ['鼠', '猪'];
    const todayZhi = today.dayZhi;
    const zhiToName = {
      '子': '鼠', '丑': '牛', '寅': '虎', '卯': '兔',
      '辰': '龙', '巳': '蛇', '午': '马', '未': '羊',
      '申': '猴', '酉': '鸡', '戌': '狗', '亥': '猪'
    };
    return {
      todayLucky: zhiToName[todayZhi] || '—',  // 今日值班属相
      longTerm: benefit,                        // 长期贵人属相
      note: `今日值神「${zhiToName[todayZhi]}」· 同属相或生肖合拍的人今天对你帮助最大`
    };
  }

  // 🏠 居家布局建议
  // 宜 = 补个人日干所缺（dayGanWx 视角） · 忌 = 避今日所忌（avoidWx）
  function _genHome(targetWx, subWx, avoidWx, seed, dayGanWx) {
    const wxToDo = {
      '水': '清理卧室/卫生间 · 放黑色陶器或小鱼缸',
      '火': '客厅添暖色靠垫 · 南向点支蜡烛或暖灯',
      '木': '窗边添绿植 · 木质家具擦拭 · 书房添书',
      '金': '西面整理 · 擦亮白/银色器皿 · 清 desk 杂物',
      '土': '中宫（客厅中心）整理 · 陶瓷摆件归位'
    };
    const wxToDont = {
      '水': '别在卫生间堆杂物 · 水龙头别滴水',
      '火': '别让厨房油烟太重 · 灶台别正对入口',
      '木': '别让绿植枯萎不换 · 书桌别背门',
      '金': '别让刀具明放 · 金属物品别锈',
      '土': '别让客厅堆杂物成山 · 地面勿积灰'
    };
    // 宜：按个人日干五行（补什么缺什么）· 牛（木）宜添木类物件 · 嘻（火）宜添火类物件
    const personalDo = wxToDo[dayGanWx] || wxToDo[targetWx];
    // 忌：按今日所忌五行 · 人人一样（因为是今日环境）
    const todayDont = wxToDont[avoidWx] || '—';
    return {
      do: personalDo,                                    // 分化的"宜"
      dont: todayDont,                                   // 今日共通"忌"
      tip: dayGanWx === avoidWx
        ? `今日${targetWx}气旺 · 你${dayGanWx}气今日被压 · 物件做减法 · 别再强化${avoidWx}`
        : `今日${targetWx}气旺 · 家里以你${dayGanWx || '主'}气物件上位 · ${avoidWx}气物件退一退`
    };
  }

  // 🗣 说话建议
  function _genSpeech(dayGanWx, todayWx, today, seed) {
    // 今日 vs 个人日干的关系 · 决定说话策略
    let toLeader = '', toPeer = '', toFamily = '', tone = '';
    if (dayGanWx === todayWx) {
      tone = '今日自信足 · 表达清晰有力';
      toLeader = '可以主动汇报推进 · 但别显得锋芒过露';
      toPeer = '主动发起话题 · 适合团队提案';
      toFamily = '用"我们"开头 · 共情易共鸣';
    } else if (WX_SHENG[todayWx] === dayGanWx) {
      tone = '今日耐心高 · 听多于说';
      toLeader = '先听 · 再回 · 领导会觉得你深度';
      toPeer = '做桥梁 · 帮人牵线今天最容易记住';
      toFamily = '多问少答 · 对方会说更多';
    } else if (WX_SHENG[dayGanWx] === todayWx) {
      tone = '今日输出欲高 · 注意别说太满';
      toLeader = '提方案一条一条说 · 别一口气 3 个';
      toPeer = '分享想法可以 · 别抢话';
      toFamily = '关心话说 2 句就够 · 别唠叨';
    } else if (WX_KE[todayWx] === dayGanWx) {
      tone = '今日易被误解 · 慎言';
      toLeader = '别主动 challange · 今天说错会被放大';
      toPeer = '回避争议话题 · 不评论别人';
      toFamily = '用 "我感觉..." 开头 · 避开 "你总是..."';
    } else if (WX_KE[dayGanWx] === todayWx) {
      tone = '今日表达力强 · 适合对外';
      toLeader = '可谈判/可提要求 · 气场强';
      toPeer = '适合主持/主讲 · 带节奏';
      toFamily = '说重要事今天最易被听进去';
    } else {
      tone = '今日平稳表达 · 无大起伏';
      toLeader = '照旧汇报即可';
      toPeer = '自然交流';
      toFamily = '日常话题';
    }
    return { tone, toLeader, toPeer, toFamily };
  }

  /* ━━━━━━━━━━ 9. 塔罗 ━━━━━━━━━━ */
  const TAROT_POOL = [
    // ━━ 大阿卡纳 22 ━━
    { id: 0, name: '愚者', en: 'The Fool', emoji: '🃏', element: 'arcana', up: '新开始 · 冒险 · 自由', dn: '鲁莽 · 不计后果', core: '未知之旅的起点 · 一切皆有可能 · 不带包袱地出发', upAdvice: '今天值得放下顾虑试一件新事 · 小步迈出即可', dnAdvice: '慎防未经思考就跳 · 先摸清场再动' },
    { id: 1, name: '魔术师', en: 'The Magician', emoji: '🎩', element: 'arcana', up: '创造力 · 行动力 · 技能', dn: '操纵 · 浮夸', core: '你已经拥有所需的一切工具 · 关键是把意图化为行动', upAdvice: '今天集中把散落的资源连起来做一件事 · 不要分心', dnAdvice: '说比做多 · 收敛画饼 · 拿出一个真正的成品' },
    { id: 2, name: '女祭司', en: 'The High Priestess', emoji: '🌙', element: 'arcana', up: '直觉 · 神秘 · 智慧', dn: '忽视内心 · 隐藏', core: '答案不在外面 · 静下来听自己内心的声音', upAdvice: '今天少说多听 · 写下不安和直觉 · 会看到线索', dnAdvice: '别再压抑 · 面对那个你一直不想面对的感觉' },
    { id: 3, name: '皇后', en: 'The Empress', emoji: '👑', element: 'arcana', up: '丰盛 · 母性 · 创造', dn: '依赖 · 过度保护', core: '接纳与滋养 · 让事情自然生长 · 不急着催熟', upAdvice: '给自己/伴侣/家人一次无条件的宠爱 · 不求回报', dnAdvice: '警惕"都为你好"变成控制 · 放手让对方成长' },
    { id: 4, name: '皇帝', en: 'The Emperor', emoji: '⚔️', element: 'arcana', up: '权威 · 结构 · 父性', dn: '独裁 · 僵化', core: '建立规则 · 用结构对抗混乱 · 先立再行', upAdvice: '把正在乱的事列清单 · 今天定 3 条可执行规则', dnAdvice: '松一松 · 不是所有事都要你拍板 · 授权出去' },
    { id: 5, name: '教皇', en: 'The Hierophant', emoji: '⛪', element: 'arcana', up: '传统 · 教导 · 信仰', dn: '保守 · 教条', core: '向体系学习 · 向过来人请教 · 不必重新发明轮子', upAdvice: '今天找一位你敬佩的前辈请教一个具体问题', dnAdvice: '别让"一直这样做"挡了更好的路 · 尝试打破' },
    { id: 6, name: '恋人', en: 'The Lovers', emoji: '💞', element: 'arcana', up: '关系 · 选择 · 和谐', dn: '失衡 · 三角', core: '重要的关系需要主动选择 · 承担选择后的责任', upAdvice: '今天对关系做一次清晰表态 · 不模糊 · 不拖', dnAdvice: '感情模糊地带要踩刹车 · 守住自己的边界' },
    { id: 7, name: '战车', en: 'The Chariot', emoji: '🏇', element: 'arcana', up: '掌控 · 决心 · 胜利', dn: '失控 · 鲁莽', core: '两股反向力量并驾 · 靠意志力驶向目标', upAdvice: '今天拿下你拖延很久的那件事 · 一气呵成', dnAdvice: '你在硬推一件不可推的事 · 退一步重新校准' },
    { id: 8, name: '力量', en: 'Strength', emoji: '🦁', element: 'arcana', up: '勇气 · 耐心 · 内在力', dn: '怀疑 · 软弱', core: '柔能克刚 · 用温和而坚定的方式驯服内心的野兽', upAdvice: '面对那个让你不安的处境 · 带着温柔不带怒气', dnAdvice: '别被恐惧吞没 · 你比你想的更有力量' },
    { id: 9, name: '隐士', en: 'The Hermit', emoji: '🕯️', element: 'arcana', up: '内省 · 智慧 · 独处', dn: '孤立 · 拒绝', core: '向内寻光 · 独处是为更好地再出发', upAdvice: '今天留 30 分钟独处 · 不刷手机 · 只思考', dnAdvice: '小心把独处变成逃避 · 该沟通时还是要沟通' },
    { id: 10, name: '命运之轮', en: 'Wheel of Fortune', emoji: '🎡', element: 'arcana', up: '机遇 · 转折 · 因果', dn: '逆境 · 阻碍', core: '事物在循环流转 · 顺势而为比逆势强推更省力', upAdvice: '观察今天出现的那个转机 · 不犹豫 · 上车', dnAdvice: '暂时的坎是循环一部分 · 别把它当永久的失败' },
    { id: 11, name: '正义', en: 'Justice', emoji: '⚖️', element: 'arcana', up: '公平 · 真相 · 因果', dn: '不公 · 偏见', core: '每一个行为都会精准回响 · 现在做的会在未来精准返回', upAdvice: '今天把那件"差一口气就说清楚"的事说清楚', dnAdvice: '先检视自己的偏见 · 再评判别人' },
    { id: 12, name: '倒吊人', en: 'The Hanged Man', emoji: '🙃', element: 'arcana', up: '换角度 · 牺牲 · 觉悟', dn: '执着 · 拖延', core: '暂停不是失败 · 是为了看见之前看不到的角度', upAdvice: '今天放弃一个你一直强推的做法 · 换个路径试试', dnAdvice: '别再原地死磕 · 这件事的关键在别处 · 放下一会' },
    { id: 13, name: '死神', en: 'Death', emoji: '💀', element: 'arcana', up: '结束 · 转化 · 重生', dn: '抗拒改变', core: '一个阶段真的结束了 · 结束是新生的前提', upAdvice: '今天正式告别那件/人 · 仪式感地做个了结', dnAdvice: '你知道它该结束了 · 只是还没愿意面对' },
    { id: 14, name: '节制', en: 'Temperance', emoji: '🍷', element: 'arcana', up: '平衡 · 调和 · 耐心', dn: '失衡 · 极端', core: '慢火熬 · 耐心混合 · 中道是最强的力', upAdvice: '今天做事别极端 · 热情和理性各留一半', dnAdvice: '你在走两端 · 不是太狠就是放弃 · 找中段' },
    { id: 15, name: '恶魔', en: 'The Devil', emoji: '😈', element: 'arcana', up: '欲望 · 束缚 · 物质', dn: '挣脱 · 觉醒', core: '警觉那个把你捆住的习惯 · 其实是你自己攥着绳', upAdvice: '今天对那个让你上瘾的东西说不 · 试一天', dnAdvice: '你已经在觉醒边缘 · 下决心迈出那一步' },
    { id: 16, name: '塔', en: 'The Tower', emoji: '🗼', element: 'arcana', up: '剧变 · 觉醒 · 突破', dn: '避免崩塌', core: '伪装终将崩塌 · 废墟里长出真实', upAdvice: '把今天发生的变故当礼物 · 它在帮你腾出位置', dnAdvice: '有东西在摇晃 · 早一点面对 · 别等它塌' },
    { id: 17, name: '星星', en: 'The Star', emoji: '⭐', element: 'arcana', up: '希望 · 灵感 · 治愈', dn: '迷茫 · 失落', core: '风暴之后的宁静 · 重新连接本真的自己', upAdvice: '今天做一件让自己"感觉回来了"的小事', dnAdvice: '你需要重新找回希望 · 先从 5 分钟深呼吸开始' },
    { id: 18, name: '月亮', en: 'The Moon', emoji: '🌝', element: 'arcana', up: '幻想 · 不确定 · 直觉', dn: '迷惑 · 焦虑', core: '事情不是它看起来的样子 · 信直觉别信眼见', upAdvice: '今天重要决定推一推 · 等水面平静再看', dnAdvice: '别让焦虑放大假想的怪兽 · 实际看一看' },
    { id: 19, name: '太阳', en: 'The Sun', emoji: '☀️', element: 'arcana', up: '成功 · 喜悦 · 活力', dn: '过曝 · 自负', core: '纯粹的喜悦 · 一切清明 · 努力被看见', upAdvice: '今天享受这个好状态 · 公开展示你的成果', dnAdvice: '高光时刻要谦逊 · 别把自信变成自负' },
    { id: 20, name: '审判', en: 'Judgement', emoji: '📯', element: 'arcana', up: '觉醒 · 召唤 · 重生', dn: '逃避 · 不甘', core: '内心召唤响起 · 听从它 · 这是你真正该走的路', upAdvice: '今天回应那个你一直拖着的"该做的事"', dnAdvice: '别再骗自己 · 你知道该做什么 · 就是怕做' },
    { id: 21, name: '世界', en: 'The World', emoji: '🌍', element: 'arcana', up: '完成 · 圆满 · 旅行', dn: '未竟 · 拖延', core: '一个循环完美收束 · 庆祝它 · 然后开启下一个', upAdvice: '今天给一件事画上句号 · 仪式感地庆祝', dnAdvice: '你在逃避收尾 · 收尾不是结束 · 是新开始' },
    // ━━ 小阿卡纳 · 权杖（火）━━
    { id: 22, name: '权杖王牌', en: 'Ace of Wands', emoji: '🪄', element: 'fire', up: '行动 · 灵感 · 起步', dn: '延迟 · 能量低', core: '一颗新的火种落进你心里 · 是时候点燃它', upAdvice: '今天启动那个酝酿很久的项目 · 不要完美主义', dnAdvice: '能量卡住是信号 · 先照顾状态 · 再谈开始' },
    { id: 23, name: '权杖三', en: 'Three of Wands', emoji: '🌅', element: 'fire', up: '远见 · 拓展 · 机会到', dn: '视野太窄 · 受阻', core: '你已经建好基础 · 现在是向远方眺望的时刻', upAdvice: '今天抬头看三个月后 · 不是眼前那一步', dnAdvice: '视野太窄了 · 去见一个行业外的朋友聊聊' },
    { id: 24, name: '权杖九', en: 'Nine of Wands', emoji: '🛡️', element: 'fire', up: '坚持 · 最后一口气 · 守护', dn: '透支 · 该歇了', core: '受伤的战士扶着权杖 · 但目光坚定 · 再撑一下就到', upAdvice: '今天带伤站岗 · 别放弃 · 终点就在眼前', dnAdvice: '身体在求救 · 先休息 · 不是所有战都要现在打' },
    { id: 25, name: '权杖十', en: 'Ten of Wands', emoji: '🎒', element: 'fire', up: '负担 · 责任 · 压顶', dn: '放下 · 卸担', core: '你背的太多了 · 一个人扛所有并不是勇敢', upAdvice: '今天从清单里删掉 2 件不是必须你做的事', dnAdvice: '把活交给别人 · 不是失败 · 是智慧' },
    // ━━ 圣杯（水）━━
    { id: 26, name: '圣杯王牌', en: 'Ace of Cups', emoji: '🍷', element: 'water', up: '情感 · 滋养 · 新感情', dn: '空虚 · 情感堵塞', core: '一股爱的泉水涌出来 · 打开心去接住它', upAdvice: '今天主动关心一个你珍视的人 · 说出感谢', dnAdvice: '心是关的 · 先允许自己脆弱 · 情感才会流动' },
    { id: 27, name: '圣杯二', en: 'Two of Cups', emoji: '💑', element: 'water', up: '相遇 · 共鸣 · 合伙', dn: '冷淡 · 失联', core: '两个灵魂的举杯 · 彼此是彼此的镜子', upAdvice: '今天和重要的人做一件"我们一起"的小事', dnAdvice: '关系有裂痕 · 主动修补 · 你不伸手对方也不会' },
    { id: 28, name: '圣杯六', en: 'Six of Cups', emoji: '🧸', element: 'water', up: '怀旧 · 童心 · 温暖记忆', dn: '沉湎过去 · 走不出', core: '过去给的礼物 · 今天拆开 · 然后继续前行', upAdvice: '今天和老朋友/家人联系 · 重温一个好回忆', dnAdvice: '活在过去不会让现在更好 · 向前看' },
    { id: 29, name: '圣杯十', en: 'Ten of Cups', emoji: '🏠', element: 'water', up: '幸福 · 圆满 · 家的感觉', dn: '失和 · 貌合神离', core: '彩虹下的家 · 你已经拥有幸福的全部素材', upAdvice: '今天停一停 · 感谢身边人 · 幸福就在眼前', dnAdvice: '家里的那个结要面对 · 别装作看不见' },
    // ━━ 宝剑（风）━━
    { id: 30, name: '宝剑王牌', en: 'Ace of Swords', emoji: '⚔️', element: 'air', up: '清晰 · 突破 · 真相', dn: '混乱 · 信息噪声', core: '一道闪电划破迷雾 · 真相突然清晰', upAdvice: '今天把事情想透 · 一次性做完决策 · 别反复', dnAdvice: '信息过载了 · 关掉一半渠道 · 只留 3 个最核心' },
    { id: 31, name: '宝剑三', en: 'Three of Swords', emoji: '💔', element: 'air', up: '心碎 · 真相 · 痛的领悟', dn: '愈合 · 疗愈', core: '三把剑穿心 · 痛是真的 · 但痛之后有领悟', upAdvice: '今天允许自己难过 · 难过之后写下学到什么', dnAdvice: '伤口在结痂 · 别再抠它 · 让时间做它的事' },
    { id: 32, name: '宝剑七', en: 'Seven of Swords', emoji: '🎭', element: 'air', up: '策略 · 偷取 · 隐藏', dn: '坦诚 · 面对', core: '有些事适合暗中做 · 但小心成本比收益大', upAdvice: '今天不公开的事可以低调推进 · 但别骗人', dnAdvice: '你知道自己在逃避坦诚 · 今天就把话说清楚' },
    { id: 33, name: '宝剑十', en: 'Ten of Swords', emoji: '🌑', element: 'air', up: '终结 · 谷底 · 黎明前', dn: '黎明 · 复苏', core: '十把剑插在身后 · 但太阳正在升起', upAdvice: '今天这是谷底 · 意思是 · 之后都会更好', dnAdvice: '你已经在回升 · 抬头看那个升起的太阳' },
    // ━━ 星币（土）━━
    { id: 34, name: '星币王牌', en: 'Ace of Pentacles', emoji: '🪙', element: 'earth', up: '财运 · 机遇 · 实际回报', dn: '错失 · 贪念', core: '一颗稳稳的种子递到你手里 · 把它种进地', upAdvice: '今天抓住一个实际机会 · 钱/工作/健康其中之一', dnAdvice: '眼前有机会但你太贪了 · 先拿住手里这只鸟' },
    { id: 35, name: '星币四', en: 'Four of Pentacles', emoji: '💰', element: 'earth', up: '守财 · 稳固 · 掌控', dn: '吝啬 · 抓太紧', core: '紧紧抱着四枚金币 · 但忘了金币是用来流通的', upAdvice: '今天守住你该守的 · 不乱花', dnAdvice: '抓得太紧反而会溜走 · 给出去一部分 · 才能循环' },
    { id: 36, name: '星币六', en: 'Six of Pentacles', emoji: '🤝', element: 'earth', up: '给予 · 平衡 · 互惠', dn: '失衡 · 施舍感', core: '给与拿的秤 · 今天它指向平衡', upAdvice: '今天帮一个需要帮的人 · 或大方接受一次帮助', dnAdvice: '关系不对等了 · 你一直付出/一直索取 · 调平' },
    { id: 37, name: '星币十', en: 'Ten of Pentacles', emoji: '🏛️', element: 'earth', up: '富足 · 传承 · 家族根基', dn: '物欲 · 只认钱', core: '跨越几代人的富足 · 不只是钱 · 是根', upAdvice: '今天为"长远"做一件事 · 投资/买书/家人陪伴', dnAdvice: '别把所有值价钱的事变成只是钱 · 意义更重要' }
  ];

  function drawTarot(question, seed) {
    const list = TAROT_POOL;
    const idx = (seed != null) ? (seed % list.length) : Math.floor(Math.random() * list.length);
    const card = list[idx];
    const reversed = Math.random() < 0.4;
    return {
      ...card,
      reversed,
      meaning: reversed ? card.dn : card.up,
      question: question || null,
      time: new Date().toISOString()
    };
  }

  function todayCard(userId, today) {
    // 同一用户同一天抽到同一张固定牌（基于日期+userId 哈希）
    const key = `${userId}-${today.dayGan}${today.dayZhi}`;
    let h = 0;
    for (const ch of key) h = (h * 31 + ch.charCodeAt(0)) | 0;
    const idx = Math.abs(h) % TAROT_POOL.length;
    const card = TAROT_POOL[idx];
    const reversed = (Math.abs(h) % 10) < 4;
    return {
      ...card,
      reversed,
      meaning: reversed ? card.dn : card.up,
      time: new Date().toISOString()
    };
  }

  /* ━━━━━━━━━━ 10. 签到 / localStorage ━━━━━━━━━━ */
  function getStorageKey(userId, suffix) { return `LUCK_${userId}_${suffix}`; }

  function loadState(userId) {
    try {
      const raw = localStorage.getItem(getStorageKey(userId, 'state'));
      return raw ? JSON.parse(raw) : { streak: 0, totalDays: 0, lastDate: null, history: [], tarotHistory: [] };
    } catch (e) { return { streak: 0, totalDays: 0, lastDate: null, history: [], tarotHistory: [] }; }
  }
  function saveState(userId, state) {
    try { localStorage.setItem(getStorageKey(userId, 'state'), JSON.stringify(state)); } catch (e) {}
  }
  function autoSign(userId, todayScore) {
    const state = loadState(userId);
    const today = new Date().toISOString().slice(0, 10);
    if (state.lastDate === today) {
      return { ...state, alreadySigned: true };
    }
    const yest = new Date(); yest.setDate(yest.getDate() - 1);
    const yestStr = yest.toISOString().slice(0, 10);
    if (state.lastDate === yestStr) {
      state.streak += 1;
    } else {
      state.streak = 1;
    }
    state.totalDays += 1;
    state.lastDate = today;
    state.history = state.history || [];
    state.history.push({ date: today, score: todayScore });
    if (state.history.length > 90) state.history = state.history.slice(-90);
    saveState(userId, state);
    return { ...state, alreadySigned: false };
  }

  function pushTarotRecord(userId, card) {
    const state = loadState(userId);
    state.tarotHistory = state.tarotHistory || [];
    state.tarotHistory.push({ ...card, ts: Date.now() });
    if (state.tarotHistory.length > 50) state.tarotHistory = state.tarotHistory.slice(-50);
    saveState(userId, state);
  }

  /* ━━━━━━━━━━ 11. 主入口 compute() ━━━━━━━━━━ */
  function compute(user, options) {
    options = options || {};
    const now = options.now || new Date();
    // 只有当 user.bazi 是对象时才用；字符串（展示用的 "己巳·己巳·..."）跳过 · 重新算
    const userBazi = (user.bazi && typeof user.bazi === 'object')
      ? user.bazi
      : calcBazi(user.year, user.month, user.day, user.hour);
    const today = getTodayPillars(now);
    const theme = calcTodayTheme(userBazi, today);
    const yiJi = calcYiJi(theme, userBazi, today);
    // seed：同一人同一天稳定 · 永远不变抖动值
    const dim = calcFourDimensions(theme, userBazi, today, `${user.id}-${today.dayGan}${today.dayZhi}`);
    const gates = addPersonalHints(get12HourGates(today.dayGan), userBazi);
    const currentGate = getCurrentHourEntry(gates, now);
    const nextGood = getNextGoodGate(gates, now);
    const feixing = calcDayFeixing(now);
    const recommendations = calcRecommendations(userBazi, today, feixing, user.id);
    const tarot = todayCard(user.id, today);
    const score = Math.round((dim.事业 + dim.财运 + dim.社交 + dim.健康) / 4);

    return {
      user, userBazi, today, theme, yiJi, dim, score,
      gates, currentGate, nextGood, feixing, recommendations, tarot,
      generatedAt: now.toISOString()
    };
  }

  /* ━━━━━━━━━━ 12. 关系今日动态（流日 × 关系核心五行） ━━━━━━━━━━ */
  //
  // 输入：
  //   relation: { keyword, score, essence, ... }  // 来自 RELATIONS 某条
  //   today:    getTodayPillars() 的返回
  //   members:  { [id]: MEMBERS[id] } 可选 · 拿双方日干做深度分析
  //   pair:     [leftId, rightId] 可选 · 做"双方对今日"组合评估
  //
  // 输出：{ today, deltaScore, flavor }
  //   - today: 一段今日相处建议（每日变化）
  //   - deltaScore: 今日对 baseScore 的浮动（-0.5 ~ +0.5）
  //   - flavor: 'strong'|'weak'|'bless'|'drain'|'neutral' 给 UI 上色

  function _relWuxingFromKeyword(keyword) {
    if (!keyword) return null;
    // 五行关键字优先级：水 > 火 > 木 > 金 > 土（水火是家里主矛盾）
    const wxs = ['水', '火', '木', '金', '土'];
    for (const wx of wxs) {
      if (keyword.includes(wx)) return wx;
    }
    return null;
  }

  function calcRelationToday(relation, today, members, pair) {
    if (!relation) return { today: '—', deltaScore: 0, flavor: 'neutral', actions: [] };
    const relWx = _relWuxingFromKeyword(relation.keyword);
    const todayWx = TIANGAN_WUXING[today.dayGan];
    const todayZhiWx = DIZHI_WUXING[today.dayZhi];
    const dayGz = `${today.dayGan}${today.dayZhi}`;

    // 如果关键字里提不出五行 · 用中性模板
    if (!relWx) {
      return {
        today: `今日 ${dayGz} · 保持现有默契 · 正常相处`,
        deltaScore: 0,
        flavor: 'neutral',
        actions: ['做一件共同的小事巩固默契', '互相分享一件今天开心的小事', '早睡 · 留明天精力']
      };
    }

    // 核心判断：今日五行 × 关系五行
    let tpl = '', delta = 0, flavor = 'neutral', actions = [];
    if (todayWx === relWx) {
      delta = 0.4;
      flavor = 'strong';
      tpl = `流日 ${today.dayGan}${relWx} 与你俩的${relation.keyword}同频 · 今日相处能量饱满 · 宜一起做重要决定或启动计划`;
      actions = [
        `今晚一起做一件重要决策（同频加持 · 通常事半功倍）`,
        `趁势推进平时推不动的事 · 比如订旅行/谈大钱/家具升级`,
        `拍张合照记录这一天 · 今日星象对你俩很好`
      ];
    } else if (WX_SHENG[todayWx] === relWx) {
      delta = 0.25;
      flavor = 'bless';
      tpl = `流日 ${today.dayGan} 生扶你俩的${relWx}气 · 今日相处如沐春风 · 适合聊未来/做计划`;
      actions = [
        `聊聊彼此近期的想法和变化 · 今日耐心值高`,
        `一起做一件"滋养型"的事 · 逛展/散步/读书 · 不冲不燥`,
        `给对方一个小惊喜（一杯饮料/一句感谢）· 效果放大`
      ];
    } else if (WX_SHENG[relWx] === todayWx) {
      delta = -0.2;
      flavor = 'drain';
      tpl = `今日你俩的${relWx}气被流日泄耗 · 两人都会稍显疲惫 · 避免长谈 · 早睡为上`;
      actions = [
        `今天别做大决策 · 吃饭看剧 · 能量回血为主`,
        `主动说一句"今天我们都累 · 别急着沟通" · 避免被疲态误伤`,
        `11 点前睡 · 明天再聊今天的未尽事`
      ];
    } else if (WX_KE[todayWx] === relWx) {
      delta = -0.4;
      flavor = 'weak';
      tpl = `流日 ${today.dayGan} 克你俩的${relWx}气 · 少碰敏感话题 · 吃饭看剧 · 让今日自然过去`;
      actions = [
        `今天不碰钱/情绪话题 · 不翻旧账 · 不逼对方表态`,
        `做中性活动降火 · 看剧/逛超市/一起打扫`,
        `如果要沟通 · 用"我感觉..." 开头 · 避开"你怎么..."`
      ];
    } else if (WX_KE[relWx] === todayWx) {
      delta = 0.15;
      flavor = 'strong';
      tpl = `你俩的${relWx}气今日主动克流日 · 两人共进退的气场很强 · 适合一起对外（谈判/表达/出场）`;
      actions = [
        `一起出场/对外沟通 · 两人合作气场比独自强`,
        `如果有谈判/见客户 · 尽量俩人一起出现`,
        `社交场合互相帮衬 · 一个主聊 · 一个观察场`
      ];
    } else {
      tpl = `今日 ${dayGz} · 关系平稳 · 维持节奏 · 无需特别调整`;
      actions = [
        `正常相处 · 无需刻意调整`,
        `给对方一个主动的关心（发个消息/倒杯水）· 小事保温`,
        `各自忙自己的 · 晚上聚一下就好`
      ];
    }

    // 深度：双方个人的流日影响
    let bonus = '';
    if (members && pair && pair.length === 2) {
      const [a, b] = pair;
      const ma = members[a], mb = members[b];
      if (ma && mb && ma.mainWuxing && mb.mainWuxing) {
        const aImpact = _wxImpact(ma.mainWuxing, todayWx);
        const bImpact = _wxImpact(mb.mainWuxing, todayWx);
        if (aImpact === '泄' && bImpact === '生') {
          bonus = ` · ${ma.name} 今日能量偏低 · ${mb.name} 可主动照顾`;
          actions.unshift(`${mb.name} 今天主动些 · ${ma.name} 今天被流日泄气 · 多休息`);
          actions = actions.slice(0, 3);
        } else if (bImpact === '泄' && aImpact === '生') {
          bonus = ` · ${mb.name} 今日能量偏低 · ${ma.name} 可主动照顾`;
          actions.unshift(`${ma.name} 今天主动些 · ${mb.name} 今天被流日泄气 · 多休息`);
          actions = actions.slice(0, 3);
        } else if (aImpact === '克' && bImpact === '克') {
          bonus = ` · 今日双方都被流日克 · 互相体谅 · 别挑刺`;
          actions.unshift(`今日双方都被流日克 · 互相让一步 · 别挑刺`);
          actions = actions.slice(0, 3);
        }
      }
    }

    return {
      today: tpl + bonus,
      deltaScore: delta,
      flavor,
      actions
    };
  }

  // 辅助：今日五行对某人主五行的影响（"生/泄/克/胜/同/中"）
  function _wxImpact(myWx, todayWx) {
    if (!myWx || !todayWx) return '中';
    if (myWx === todayWx) return '同';
    if (WX_SHENG[todayWx] === myWx) return '生';    // 今日生我
    if (WX_SHENG[myWx] === todayWx) return '泄';    // 我生今日（泄我）
    if (WX_KE[todayWx] === myWx) return '克';       // 今日克我
    if (WX_KE[myWx] === todayWx) return '胜';       // 我克今日
    return '中';
  }

  root.LuckEngine = {
    compute,
    drawTarot,
    autoSign,
    loadState,
    saveState,
    pushTarotRecord,
    calcRelationToday,
    constants: {
      TIANGAN_WUXING, DIZHI_WUXING, SHENGXIAO,
      WX_COLORS, WX_FOODS, WX_DRINKS, WX_NUMBERS, WX_DIRECTION, WX_ACCESSORIES,
      EIGHT_GATES, GATE_INFO, FEIXING_INFO, SHISHEN_THEME, TAROT_POOL
    }
  };

})(typeof window !== 'undefined' ? window : globalThis);
