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
  const SHENGXIAO = { '子': '🐀鼠', '丑': '🐂牛', '寅': '🐯虎', '卯': '🐰兔', '辰': '🐉龙', '巳': '🐍蛇', '午': '🐎马', '未': '🐏羊', '申': '🐒猴', '酉': '🐔鸡', '戌': '🐕狗', '亥': '🐖猪' };

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
    '开门': { luck: '大吉', advice: '适合开启新任务、谈合作', plain: '能量打开了 · 想做的事就开始',         tag: '⭐' },
    '休门': { luck: '吉',   advice: '适合休息调整、复盘',     plain: '该歇就歇 · 给自己充电',            tag: '✦' },
    '生门': { luck: '大吉', advice: '适合学习新技能、谈生意', plain: '生发力强 · 学新东西 · 拓展圈子',    tag: '⭐' },
    '伤门': { luck: '凶',   advice: '不宜重大决策',           plain: '容易上头 · 说话做事先深呼吸',        tag: '⚠️' },
    '杜门': { luck: '中',   advice: '适合专注独处、研究',     plain: '关上门做自己的事 · 别社交',          tag: '·' },
    '景门': { luck: '中',   advice: '适合写报告、提案',       plain: '适合脑力活 · 写东西 · 做方案',      tag: '·' },
    '死门': { luck: '大凶', advice: '不宜出行、重大安排',     plain: '能量低 · 别开始大事 · 避开重要决定', tag: '⛔' },
    '惊门': { luck: '凶',   advice: '保持警觉、防意外',       plain: '会有突发 · 留点时间应变',            tag: '⚠️' }
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
  function calcFourDimensions(theme, userBazi, today) {
    const todayWx = TIANGAN_WUXING[today.dayGan];
    const yong = userBazi.yongShen;
    const base = todayWx === yong ? 80 : todayWx === WX_SHENG[yong] ? 70 : todayWx === WX_KE[yong] ? 35 : 55;
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
    Object.entries(w).forEach(([k, v]) => {
      dim[k] = Math.max(20, Math.min(95, Math.round(base * v + (Math.random() * 8 - 4))));
    });
    return dim;
  }

  /* ━━━━━━━━━━ 8. 趋吉行动建议（穿搭/饰品/方位/数字/饮食） ━━━━━━━━━━ */
  function calcRecommendations(userBazi, today, feixing) {
    const yong = userBazi.yongShen;
    const todayWx = TIANGAN_WUXING[today.dayGan];
    return {
      colors: WX_COLORS[yong].lucky,
      colorsAdvice: WX_COLORS[yong].advice,
      colorItems: WX_COLORS[yong].items,
      accessory: WX_ACCESSORIES[yong][Math.floor(Math.random() * WX_ACCESSORIES[yong].length)],
      direction: WX_DIRECTION[yong],
      bestDir: feixing.bestDir,
      worstDir: feixing.worstDir,
      numbers: WX_NUMBERS[yong],
      foods: WX_FOODS[yong],
      drink: WX_DRINKS[yong],
      avoid: { colors: WX_COLORS[WX_KE[yong]].lucky, dir: feixing.worstDir }
    };
  }

  /* ━━━━━━━━━━ 9. 塔罗 ━━━━━━━━━━ */
  const TAROT_POOL = [
    // 大阿卡纳 22
    { id: 0, name: '愚者', up: '新开始 · 冒险 · 自由', dn: '鲁莽 · 不计后果', emoji: '🃏' },
    { id: 1, name: '魔术师', up: '创造力 · 行动力 · 技能', dn: '操纵 · 浮夸', emoji: '🎩' },
    { id: 2, name: '女祭司', up: '直觉 · 神秘 · 智慧', dn: '忽视内心 · 隐藏', emoji: '🌙' },
    { id: 3, name: '皇后', up: '丰盛 · 母性 · 创造', dn: '依赖 · 过度保护', emoji: '👑' },
    { id: 4, name: '皇帝', up: '权威 · 结构 · 父性', dn: '独裁 · 僵化', emoji: '⚔️' },
    { id: 5, name: '教皇', up: '传统 · 教导 · 信仰', dn: '保守 · 教条', emoji: '⛪' },
    { id: 6, name: '恋人', up: '关系 · 选择 · 和谐', dn: '失衡 · 三角', emoji: '💞' },
    { id: 7, name: '战车', up: '掌控 · 决心 · 胜利', dn: '失控 · 鲁莽', emoji: '🏇' },
    { id: 8, name: '力量', up: '勇气 · 耐心 · 内在力', dn: '怀疑 · 软弱', emoji: '🦁' },
    { id: 9, name: '隐士', up: '内省 · 智慧 · 独处', dn: '孤立 · 拒绝', emoji: '🕯️' },
    { id: 10, name: '命运之轮', up: '机遇 · 转折 · 因果', dn: '逆境 · 阻碍', emoji: '🎡' },
    { id: 11, name: '正义', up: '公平 · 真相 · 因果', dn: '不公 · 偏见', emoji: '⚖️' },
    { id: 12, name: '倒吊人', up: '换角度 · 牺牲 · 觉悟', dn: '执着 · 拖延', emoji: '🙃' },
    { id: 13, name: '死神', up: '结束 · 转化 · 重生', dn: '抗拒改变', emoji: '💀' },
    { id: 14, name: '节制', up: '平衡 · 调和 · 耐心', dn: '失衡 · 极端', emoji: '🍷' },
    { id: 15, name: '恶魔', up: '欲望 · 束缚 · 物质', dn: '挣脱 · 觉醒', emoji: '😈' },
    { id: 16, name: '塔', up: '剧变 · 觉醒 · 突破', dn: '避免崩塌', emoji: '🗼' },
    { id: 17, name: '星星', up: '希望 · 灵感 · 治愈', dn: '迷茫 · 失落', emoji: '⭐' },
    { id: 18, name: '月亮', up: '幻想 · 不确定 · 直觉', dn: '迷惑 · 焦虑', emoji: '🌝' },
    { id: 19, name: '太阳', up: '成功 · 喜悦 · 活力', dn: '过曝 · 自负', emoji: '☀️' },
    { id: 20, name: '审判', up: '觉醒 · 召唤 · 重生', dn: '逃避 · 不甘', emoji: '📯' },
    { id: 21, name: '世界', up: '完成 · 圆满 · 旅行', dn: '未竟 · 拖延', emoji: '🌍' },
    // 小阿卡纳精选 16（每花色 4 张关键牌）
    { id: 22, name: '权杖王牌', up: '行动 · 灵感 · 起步', dn: '延迟', emoji: '🪄' },
    { id: 23, name: '权杖三', up: '远见 · 拓展', dn: '受阻', emoji: '🌅' },
    { id: 24, name: '权杖九', up: '坚持 · 守护', dn: '透支', emoji: '🛡️' },
    { id: 25, name: '权杖十', up: '负担 · 责任', dn: '放下', emoji: '🎒' },
    { id: 26, name: '圣杯王牌', up: '情感 · 滋养', dn: '空虚', emoji: '🍷' },
    { id: 27, name: '圣杯二', up: '相遇 · 共鸣', dn: '冷淡', emoji: '💑' },
    { id: 28, name: '圣杯六', up: '怀旧 · 童心', dn: '走出过去', emoji: '🧸' },
    { id: 29, name: '圣杯十', up: '幸福 · 圆满', dn: '失和', emoji: '🏠' },
    { id: 30, name: '宝剑王牌', up: '清晰 · 突破', dn: '混乱', emoji: '⚔️' },
    { id: 31, name: '宝剑三', up: '心碎 · 真相', dn: '愈合', emoji: '💔' },
    { id: 32, name: '宝剑七', up: '策略 · 偷取', dn: '坦诚', emoji: '🎭' },
    { id: 33, name: '宝剑十', up: '终结 · 谷底', dn: '黎明', emoji: '🌑' },
    { id: 34, name: '星币王牌', up: '财运 · 机遇', dn: '错失', emoji: '🪙' },
    { id: 35, name: '星币四', up: '守财 · 稳固', dn: '吝啬', emoji: '💰' },
    { id: 36, name: '星币六', up: '给予 · 平衡', dn: '失衡', emoji: '🤝' },
    { id: 37, name: '星币十', up: '富足 · 传承', dn: '物欲', emoji: '🏛️' }
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
    const userBazi = user.bazi || calcBazi(user.year, user.month, user.day, user.hour);
    const today = getTodayPillars(now);
    const theme = calcTodayTheme(userBazi, today);
    const yiJi = calcYiJi(theme, userBazi, today);
    const dim = calcFourDimensions(theme, userBazi, today);
    const gates = get12HourGates(today.dayGan);
    const currentGate = getCurrentHourEntry(gates, now);
    const nextGood = getNextGoodGate(gates, now);
    const feixing = calcDayFeixing(now);
    const recommendations = calcRecommendations(userBazi, today, feixing);
    const tarot = todayCard(user.id, today);
    const score = Math.round((dim.事业 + dim.财运 + dim.社交 + dim.健康) / 4);

    return {
      user, userBazi, today, theme, yiJi, dim, score,
      gates, currentGate, nextGood, feixing, recommendations, tarot,
      generatedAt: now.toISOString()
    };
  }

  root.LuckEngine = {
    compute,
    drawTarot,
    autoSign,
    loadState,
    saveState,
    pushTarotRecord,
    constants: {
      TIANGAN_WUXING, DIZHI_WUXING, SHENGXIAO,
      WX_COLORS, WX_FOODS, WX_DRINKS, WX_NUMBERS, WX_DIRECTION, WX_ACCESSORIES,
      EIGHT_GATES, GATE_INFO, FEIXING_INFO, SHISHEN_THEME, TAROT_POOL
    }
  };

})(typeof window !== 'undefined' ? window : globalThis);
