import type {
  AlgorithmFactor,
  AlgorithmVersion,
  DailyLuckResult,
  LuckTier,
  LunarGlobals,
  MemberProfile,
  RelationProfile,
  RelationTodayResult,
  TimeWindow,
  Wuxing
} from '../types';
import { TAROT_RWS_78 } from '../data/tarot-rws-78';

export const algorithmVersion: AlgorithmVersion = {
  version: 'v2.0-explainable',
  title: '解释型日运 v2',
  notes: [
    '农历/干支计算来自 lunar.js，属于确定层',
    '时辰、飞星、推荐、塔罗属于解释层或仪式层',
    '每个分数必须带可追溯因子'
  ]
};

const TIANGAN_WUXING: Record<string, Wuxing> = {
  甲: '木', 乙: '木', 丙: '火', 丁: '火', 戊: '土', 己: '土', 庚: '金', 辛: '金', 壬: '水', 癸: '水'
};
const TIANGAN_YINYANG: Record<string, '阳' | '阴'> = {
  甲: '阳', 乙: '阴', 丙: '阳', 丁: '阴', 戊: '阳', 己: '阴', 庚: '阳', 辛: '阴', 壬: '阳', 癸: '阴'
};
const DIZHI_WUXING: Record<string, Wuxing> = {
  子: '水', 丑: '土', 寅: '木', 卯: '木', 辰: '土', 巳: '火', 午: '火', 未: '土', 申: '金', 酉: '金', 戌: '土', 亥: '水'
};
const SHENGXIAO: Record<string, string> = {
  子: '🐀鼠', 丑: '🐂牛', 寅: '🐯虎', 卯: '🐰兔', 辰: '🐉龙', 巳: '🐍蛇', 午: '🐎马', 未: '🐏羊', 申: '🐒猴', 酉: '🐔鸡', 戌: '🐕狗', 亥: '🐖猪'
};
const WX_SHENG: Record<Wuxing, Wuxing> = { 木: '火', 火: '土', 土: '金', 金: '水', 水: '木' };
const WX_KE: Record<Wuxing, Wuxing> = { 木: '土', 土: '水', 水: '火', 火: '金', 金: '木' };
const ZHI_ORDER = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
const DIZHI_HOUR: Record<string, [number, number]> = {
  子: [23, 1], 丑: [1, 3], 寅: [3, 5], 卯: [5, 7], 辰: [7, 9], 巳: [9, 11],
  午: [11, 13], 未: [13, 15], 申: [15, 17], 酉: [17, 19], 戌: [19, 21], 亥: [21, 23]
};
const HOUR_TO_DIZHI = Object.fromEntries(
  ZHI_ORDER.flatMap(zhi => {
    const [start, end] = DIZHI_HOUR[zhi];
    const hours = start > end
      ? [...Array.from({ length: 24 - start }, (_, i) => i + start), ...Array.from({ length: end }, (_, i) => i)]
      : Array.from({ length: end - start }, (_, i) => i + start);
    return hours.map(hour => [hour, zhi]);
  })
) as Record<number, string>;

const SHISHEN_THEME: Record<string, { title: string; goodFor: string[]; watchOut: string[]; scene: string }> = {
  比肩: { title: '协作与坚守', goodFor: ['和同事并肩推进项目', '维系老朋友', '安排运动', '把一个长期任务拆成 3 步'], watchOut: ['别和人比较', '注意花销', '避免硬撑面子'], scene: '今天适合团队协作，自己单打独斗不如借力。' },
  劫财: { title: '行动与冒险', goodFor: ['处理拖延事项', '主动联系老客户', '尝试新方法', '清理一个卡住的沟通'], watchOut: ['控制冲动消费', '小心争执', '别临时加码承诺'], scene: '今天能量足，但要避免太冲。' },
  食神: { title: '创意与享受', goodFor: ['头脑风暴', '美食分享', '陪伴重要的人', '写一段真实表达'], watchOut: ['别太懒', '注意饮食克制', '别把享受变成拖延'], scene: '今天适合做让自己开心的事。' },
  伤官: { title: '突破与表达', goodFor: ['提出新点子', '做演示分享', '艺术创作', '优化一个旧方案'], watchOut: ['说话注意分寸', '别和上级硬碰硬', '不要为了爽而把话说满'], scene: '今天表达欲强，适合展示作品但要看场合。' },
  偏财: { title: '机会与人脉', goodFor: ['拓展人脉', '副业推进', '小额投资研究', '盘点手上的可交换资源'], watchOut: ['别冲动消费', '警惕投机', '不要被临时机会带偏主线'], scene: '今天财气流动，适合谈合作和拓展人脉。' },
  正财: { title: '务实与积累', goodFor: ['处理财务', '做预算', '稳扎稳打', '把一个预算或清单补齐'], watchOut: ['避免冒险投资', '别拖延正事', '别为省小钱牺牲效率'], scene: '今天适合做踏实事，不适合冒进。' },
  七杀: { title: '攻坚与压力', goodFor: ['啃硬任务', '处理棘手问题', '高强度训练', '给风险项定边界'], watchOut: ['注意健康', '避免冲突', '不要把压力转嫁给亲近的人'], scene: '今天压力偏大，但适合攻克难关。' },
  正官: { title: '规范与晋升', goodFor: ['向上汇报', '正式会议', '按流程办事', '整理证据链和时间线'], watchOut: ['别打擦边球', '别显得不靠谱', '不要口头承诺无记录'], scene: '今天适合正式场合。' },
  偏印: { title: '深度与孤独', goodFor: ['深度学习', '研究钻研', '独处复盘', '整理一个复杂问题'], watchOut: ['别多想', '别陷入纠结', '不要越查越散'], scene: '今天适合一个人静下来思考。' },
  正印: { title: '滋养与学习', goodFor: ['看书上课', '请教前辈', '陪父母', '做一次低强度恢复'], watchOut: ['别太依赖别人', '注意作息', '不要用准备代替行动'], scene: '今天适合学习和被照顾。' }
};

const WX_PACK: Record<Wuxing, { colors: string[]; foods: string[]; drink: string; numbers: number[]; direction: string }> = {
  金: { colors: ['白色', '银色'], foods: ['白萝卜山药排骨汤', '清蒸鲈鱼'], drink: '白茶 / 雪梨银耳汤', numbers: [4, 9], direction: '正西' },
  木: { colors: ['绿色', '青色'], foods: ['酸汤肥牛', '西兰花虾仁'], drink: '绿茶 / 柠檬水', numbers: [3, 8], direction: '正东' },
  水: { colors: ['黑色', '深蓝'], foods: ['海带豆腐汤', '紫菜蛋花汤'], drink: '黑咖 / 矿泉水', numbers: [1, 6], direction: '正北' },
  火: { colors: ['红色', '紫色'], foods: ['番茄牛腩', '红焖羊肉'], drink: '红茶 / 桂花酒酿', numbers: [2, 7], direction: '正南' },
  土: { colors: ['黄色', '米色'], foods: ['南瓜小米粥', '土豆牛肉'], drink: '南瓜拿铁 / 玉米汁', numbers: [5, 0], direction: '中宫/东北/西南' }
};

const GATES = ['开门', '伤门', '生门', '杜门', '休门', '景门', '死门', '惊门'];
const GATE_INFO: Record<string, Pick<TimeWindow, 'luck' | 'advice'>> = {
  开门: { luck: '大吉', advice: '适合开启新任务、谈合作' },
  休门: { luck: '吉', advice: '适合休息调整、复盘' },
  生门: { luck: '大吉', advice: '适合学习新技能、谈生意' },
  伤门: { luck: '凶', advice: '不宜重大决策' },
  杜门: { luck: '中', advice: '适合专注独处、研究' },
  景门: { luck: '中', advice: '适合写报告、提案' },
  死门: { luck: '大凶', advice: '不宜出行、重大安排' },
  惊门: { luck: '凶', advice: '保持警觉、防意外' }
};

const TAROT = TAROT_RWS_78;

function solar() {
  const globals = globalThis as typeof globalThis & LunarGlobals;
  if (!globals.Solar) throw new Error('vendor/lunar.js 未加载');
  return globals.Solar;
}

function stableHash(input: string): number {
  let h = 0;
  for (let i = 0; i < input.length; i += 1) h = ((h * 31) + input.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function clampScore(value: number): number {
  return Math.max(20, Math.min(95, Math.round(value)));
}

function getShiShen(dayGan: string, otherGan: string): string {
  const dWx = TIANGAN_WUXING[dayGan];
  const oWx = TIANGAN_WUXING[otherGan];
  const same = TIANGAN_YINYANG[dayGan] === TIANGAN_YINYANG[otherGan];
  if (dWx === oWx) return same ? '比肩' : '劫财';
  if (WX_SHENG[dWx] === oWx) return same ? '食神' : '伤官';
  if (WX_KE[dWx] === oWx) return same ? '偏财' : '正财';
  if (WX_KE[oWx] === dWx) return same ? '七杀' : '正官';
  if (WX_SHENG[oWx] === dWx) return same ? '偏印' : '正印';
  return '正官';
}

function baziFor(member: MemberProfile) {
  const [year, month, day] = member.birthDate.split('-').map(Number);
  const lunar = solar().fromYmdHms(year, month, day, member.birthHour ?? 12, 0, 0).getLunar();
  const eight = lunar.getEightChar();
  const pillars = {
    yearGan: eight.getYearGan(), yearZhi: eight.getYearZhi(),
    monthGan: eight.getMonthGan(), monthZhi: eight.getMonthZhi(),
    dayGan: eight.getDayGan(), dayZhi: eight.getDayZhi(),
    timeGan: eight.getTimeGan(), timeZhi: eight.getTimeZhi()
  };
  return {
    ...pillars,
    dayWx: TIANGAN_WUXING[pillars.dayGan],
    yong: member.yong ?? seasonYong(pillars.monthZhi)
  };
}

function todayFor(date: Date) {
  const lunar = solar().fromYmdHms(date.getFullYear(), date.getMonth() + 1, date.getDate(), date.getHours(), date.getMinutes(), date.getSeconds()).getLunar();
  return {
    yearGan: lunar.getYearGan(), yearZhi: lunar.getYearZhi(),
    monthGan: lunar.getMonthGan(), monthZhi: lunar.getMonthZhi(),
    dayGan: lunar.getDayGan(), dayZhi: lunar.getDayZhi(),
    timeGan: lunar.getTimeGan(), timeZhi: lunar.getTimeZhi(),
    lunar: `${lunar.getYearInGanZhi()}年 ${lunar.getMonthInChinese()}月 ${lunar.getDayInChinese()}`,
    ganzhi: `${lunar.getDayGan()}${lunar.getDayZhi()}`,
    animal: SHENGXIAO[lunar.getDayZhi()]
  };
}

function seasonYong(monthZhi: string): Wuxing {
  if ('亥子丑'.includes(monthZhi)) return '火';
  if ('巳午未'.includes(monthZhi)) return '水';
  if ('寅卯辰'.includes(monthZhi)) return '金';
  if ('申酉戌'.includes(monthZhi)) return '火';
  return '土';
}

function rangeLabel([start, end]: [number, number]) {
  const pad = (n: number) => String(n === 0 ? 24 : n).padStart(2, '0');
  return `${pad(start)}-${pad(end)}`;
}

function windowsFor(todayGan: string, memberWx: Wuxing): TimeWindow[] {
  const seed = '甲乙丙丁戊己庚辛壬癸'.indexOf(todayGan);
  return ZHI_ORDER.map((zhi, i) => {
    const gate = GATES[(i * 5 + seed * 3) % GATES.length];
    const hourWx = DIZHI_WUXING[zhi];
    let personalTag = '中性';
    if (hourWx === memberWx) personalTag = '同气';
    else if (WX_SHENG[hourWx] === memberWx) personalTag = '生身';
    else if (WX_SHENG[memberWx] === hourWx) personalTag = '泄身';
    else if (WX_KE[hourWx] === memberWx) personalTag = '克身';
    else if (WX_KE[memberWx] === hourWx) personalTag = '胜出';
    return {
      zhi,
      range: rangeLabel(DIZHI_HOUR[zhi]),
      gate,
      ...GATE_INFO[gate],
      personalTag,
      factorIds: ['hour-gate', 'personal-hour']
    };
  });
}

function currentWindow(windows: TimeWindow[], date: Date) {
  return windows.find(item => item.zhi === HOUR_TO_DIZHI[date.getHours()]) ?? windows[0];
}

function nextGood(windows: TimeWindow[], date: Date) {
  const minutes = date.getHours() * 60 + date.getMinutes();
  let best = windows[0];
  let bestDiff = Number.POSITIVE_INFINITY;
  for (const item of windows.filter(windowItem => windowItem.luck === '吉' || windowItem.luck === '大吉')) {
    const start = DIZHI_HOUR[item.zhi][0] * 60;
    const diff = start > minutes ? start - minutes : start + 1440 - minutes;
    if (diff < bestDiff) {
      best = item;
      bestDiff = diff;
    }
  }
  return best;
}

function relationWx(keyword: string): Wuxing | null {
  return (['水', '火', '木', '金', '土'] as Wuxing[]).find(wx => keyword.includes(wx)) ?? null;
}

function genDailyExtensions(member: MemberProfile, theme: { goodFor: string[]; watchOut: string[] }, targetWx: Wuxing, avoidWx: Wuxing, todayWx: Wuxing) {
  const bodyByWx: Record<Wuxing, string> = {
    木: '多伸展，少久坐，眼睛和肩颈要放松',
    火: '少上火，少暴晒，重要回复先停 10 分钟',
    土: '稳脾胃，别贪凉，处理杂事先分堆',
    金: '注意呼吸，少讲重话，空间保持清爽',
    水: '补水早睡，减少信息噪声，晚上别硬撑'
  };
  const speechByWx: Record<Wuxing, string> = {
    木: '先提方向，再讲理由，避免揽过多活',
    火: '表达可以亮，但不要把话说满',
    土: '慢一点说，结论要落在执行上',
    金: '少评判，多给标准和证据',
    水: '多问少答，先听完再给建议'
  };

  return {
    yi: [...theme.goodFor, `补${targetWx}：穿搭/饮食/方位同向强化`].slice(0, 5),
    ji: [...theme.watchOut, `避${avoidWx}：今天不要在${WX_PACK[avoidWx].direction}久坐`, todayWx === '火' ? '避免情绪化回复' : '避免临时改大计划'].slice(0, 5),
    avoidList: [
      `少碰${WX_PACK[avoidWx].colors.join('/')}`,
      `避开${WX_PACK[avoidWx].direction}位久坐`,
      todayWx === member.mainWuxing ? '能量同频但容易过载，别把日程排满' : `今日${todayWx}气主导，先顺势不要硬顶`,
      '所有重要决定留一个复核点'
    ],
    wellness: [
      { label: '身体', value: bodyByWx[member.mainWuxing] },
      { label: '饮水', value: targetWx === '水' ? '今天补水是主动作，上午先完成 800ml' : '常温水分段喝，别靠咖啡硬顶' },
      { label: '睡眠', value: '23:30 前收尾，睡前不做争论型沟通' }
    ],
    helper: [
      { label: '贵人方向', value: WX_PACK[targetWx].direction },
      { label: '贵人气质', value: targetWx === '水' ? '冷静、信息全、能降温的人' : targetWx === '木' ? '愿意一起生发新想法的人' : '能给结构和边界的人' }
    ],
    home: [
      { label: '宜', value: targetWx === '水' ? '整理饮水区/卧室，降低噪声' : `让${targetWx}气物件上位，桌面做减法` },
      { label: '忌', value: `不要强化${avoidWx}气：${WX_PACK[avoidWx].colors.join('/')}少用` }
    ],
    speech: [
      { label: '对外', value: speechByWx[member.mainWuxing] },
      { label: '亲密关系', value: '先说感受，再说请求，不翻旧账' },
      { label: '工作', value: '结论前置，证据放后面，避免临时承诺' }
    ]
  };
}

function radarFrom(dimensions: DailyLuckResult['dimensions'], score: number, targetWx: Wuxing, current: TimeWindow, theme: { title: string }) {
  return [
    { id: 'career', label: '事业', value: dimensions.事业, summary: theme.title, detail: '由十神主题和今日用神状态共同影响。' },
    { id: 'wealth', label: '财运', value: dimensions.财运, summary: WX_PACK[targetWx].direction, detail: `今日财务动作围绕${targetWx}气，先稳再动。` },
    { id: 'social', label: '社交', value: dimensions.社交, summary: current.personalTag, detail: `当前时辰与你主气关系为${current.personalTag}。` },
    { id: 'health', label: '健康', value: dimensions.健康, summary: '作息优先', detail: '低分时先保身体节奏，不用硬推。' },
    { id: 'timing', label: '时机', value: current.luck === '大吉' ? 88 : current.luck === '吉' ? 74 : current.luck === '中' ? 58 : 38, summary: `${current.zhi}时${current.gate}`, detail: current.advice },
    { id: 'ritual', label: '仪式', value: Math.max(45, Math.min(88, score + 12)), summary: '塔罗只做提示', detail: '用于提醒今日心态，不进入核心分数。' }
  ];
}

export function computeDailyLuck(member: MemberProfile, date = new Date()): DailyLuckResult {
  const bazi = baziFor(member);
  const today = todayFor(date);
  const todayWx = TIANGAN_WUXING[today.dayGan];
  const shiShen = getShiShen(bazi.dayGan, today.dayGan);
  const theme = SHISHEN_THEME[shiShen] ?? SHISHEN_THEME.正官;
  const base = todayWx === bazi.yong ? 80 : WX_SHENG[todayWx] === bazi.yong ? 70 : WX_KE[todayWx] === bazi.yong ? 35 : 55;
  const weights = {
    事业: shiShen === '正官' || shiShen === '七杀' ? 1.18 : 1,
    财运: shiShen === '正财' || shiShen === '偏财' ? 1.22 : 0.96,
    社交: shiShen === '食神' || shiShen === '伤官' || shiShen === '比肩' ? 1.14 : 0.95,
    健康: shiShen === '正印' || shiShen === '食神' ? 1.16 : 0.92
  };
  const dimensions = Object.fromEntries(
    Object.entries(weights).map(([key, weight]) => [
      key,
      clampScore(base * weight + ((stableHash(`${member.id}-${today.ganzhi}-${key}`) % 9) - 4))
    ])
  ) as DailyLuckResult['dimensions'];
  const score = Math.round(Object.values(dimensions).reduce((sum, value) => sum + value, 0) / 4);
  const targetWx = todayWx === bazi.yong || WX_KE[todayWx] !== bazi.yong ? bazi.yong : member.mainWuxing;
  const avoidWx = WX_KE[targetWx];
  const pack = WX_PACK[targetWx];
  const windows = windowsFor(today.dayGan, member.mainWuxing);
  const current = currentWindow(windows, date);
  const next = nextGood(windows, date);
  const tarotIndex = stableHash(`${member.id}-${today.ganzhi}-tarot`) % TAROT.length;
  const tarot = TAROT[tarotIndex];
  const reversed = stableHash(`${today.ganzhi}-${member.id}-reversed`) % 10 < 4;
  const extensions = genDailyExtensions(member, theme, targetWx, avoidWx, todayWx);
  const radar = radarFrom(dimensions, score, targetWx, current, theme);
  const factors: AlgorithmFactor[] = [
    { id: 'calendar', label: '流日干支', value: today.ganzhi, weight: 1, tier: 'deterministic', explanation: `lunar.js 计算今日为 ${today.ganzhi} 日，${todayWx}气主导。` },
    { id: 'personal-yong', label: '个人用神', value: bazi.yong, weight: 0.9, tier: 'deterministic', explanation: `${member.name} 当前按 ${member.wuxing} / 用神${bazi.yong} 做调候主轴。` },
    { id: 'shishen', label: '十神主题', value: shiShen, weight: 0.75, tier: 'interpretive', explanation: `以个人日干 ${bazi.dayGan} 对今日天干 ${today.dayGan} 推出 ${shiShen}。` },
    { id: 'hour-gate', label: '时辰门', value: current.gate, weight: 0.45, tier: 'interpretive', explanation: `当前 ${current.zhi}时落 ${current.gate}，用于生成即时行动建议。` },
    { id: 'ritual-card', label: '塔罗仪式牌', value: tarot.name, weight: 0.15, tier: 'ritual', explanation: '塔罗只做每日仪式感，不进入核心分数。' }
  ];
  const label = score >= 76 ? '顺势推进' : score >= 60 ? '稳中有机' : score >= 45 ? '低速蓄能' : '避峰守住';
  return {
    algorithmVersion: algorithmVersion.version,
    memberId: member.id,
    date: date.toISOString().slice(0, 10),
    lunar: today.lunar,
    ganzhi: `${today.ganzhi} · ${today.animal}`,
    score,
    label,
    advice: `${theme.title} · ${current.advice}`,
    theme: {
      shiShen,
      title: theme.title,
      scene: theme.scene,
      goodFor: theme.goodFor,
      watchOut: theme.watchOut
    },
    dimensions,
    radar,
    currentWindow: current,
    nextGoodWindow: next,
    recommendations: {
      colors: pack.colors,
      foods: pack.foods,
      drink: pack.drink,
      direction: pack.direction,
      numbers: pack.numbers,
      avoid: [`少碰${WX_PACK[avoidWx].colors.join('/')}`, `避开${WX_PACK[avoidWx].direction}位久坐`],
      ...extensions
    },
    tarot: {
      id: tarot.id,
      name: tarot.name,
      en: tarot.en,
      emoji: tarot.emoji,
      reversed,
      keywords: tarot.keywords,
      core: tarot.core,
      meaning: reversed ? tarot.reversed : tarot.upright,
      question: `今天我应该如何处理“${theme.title}”？`,
      advice: tarot.advice,
      action: tarot.action,
      tier: 'ritual',
      arcana: tarot.arcana,
      suit: tarot.suit
    },
    factors,
    explanation: `综合 ${today.ganzhi} 流日、${shiShen}主题、用神${bazi.yong}和当前${current.zhi}时${current.gate}，今日建议为“${label}”。`
  };
}

export function computeRelationToday(relation: RelationProfile, date = new Date()): RelationTodayResult {
  const today = todayFor(date);
  const todayWx = TIANGAN_WUXING[today.dayGan];
  const relWx = relationWx(relation.keyword);
  let delta = 0;
  let label = '平稳';
  const realtimeReasons: string[] = [];
  if (relWx) {
    if (relWx === todayWx) {
      delta = 0.4;
      label = '同频增强';
      realtimeReasons.push(`今日${today.ganzhi}为${todayWx}气，直接加强关系主调${relWx}。`);
    } else if (WX_SHENG[todayWx] === relWx) {
      delta = 0.25;
      label = '被流日生扶';
      realtimeReasons.push(`今日${todayWx}气生扶关系${relWx}气，适合修复和推进。`);
    } else if (WX_SHENG[relWx] === todayWx) {
      delta = -0.2;
      label = '关系气被泄';
      realtimeReasons.push(`关系${relWx}气生出今日${todayWx}气，今天相处更耗能。`);
    } else if (WX_KE[todayWx] === relWx) {
      delta = -0.4;
      label = '今日压制';
      realtimeReasons.push(`今日${todayWx}气克关系${relWx}气，敏感话题要降频。`);
    } else if (WX_KE[relWx] === todayWx) {
      delta = 0.15;
      label = '对外更强';
      realtimeReasons.push(`关系${relWx}气主动克今日${todayWx}气，适合一起对外。`);
    }
  }
  if (!realtimeReasons.length) realtimeReasons.push(`今日${today.ganzhi}与关系关键词未形成强生克，按基础分稳定运行。`);
  realtimeReasons.push(`基础分 ${relation.score.toFixed(1)}，今日浮动 ${delta >= 0 ? '+' : ''}${delta.toFixed(1)}。`);
  const score = Math.max(0, Math.min(5, relation.score + delta));
  return {
    relationId: relation.id,
    score,
    delta,
    label,
    advice: delta >= 0 ? relation.actions[0] : `今天少做大沟通，先处理低成本陪伴；${relation.actions[0]}`,
    dayGanzhi: today.ganzhi,
    dayWuxing: todayWx,
    relationWuxing: relWx,
    realtimeReasons,
    factors: [
      { id: 'relation-base', label: '基础关系分', value: relation.score, weight: 1, tier: 'interpretive', explanation: relation.mechanism },
      { id: 'relation-day', label: '流日关系五行', value: relWx ?? '中性', weight: 0.4, tier: 'interpretive', explanation: `今日${today.ganzhi}为${todayWx}气，与关系关键词“${relation.keyword}”做生克判断。` }
    ]
  };
}
