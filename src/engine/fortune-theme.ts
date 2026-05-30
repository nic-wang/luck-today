// 大运 / 流年 / 流月主题叙事生成
// 算法层：基于十神 + 用神关系 → 100-150 字主题解读 + 必做 / 避免列表
// 不调 LLM · 纯模板规则 · deterministic
//
// 输入：member（带 dayGan / yong）+ 时间段干支
// 输出：FortuneTheme（结论 + narrative + lists）

import type { MemberProfile, Wuxing } from '../types';

// 干支 → 五行
const TIANGAN_WUXING: Record<string, Wuxing> = {
  甲: '木', 乙: '木', 丙: '火', 丁: '火', 戊: '土',
  己: '土', 庚: '金', 辛: '金', 壬: '水', 癸: '水'
};
const TIANGAN_YINYANG: Record<string, '阳' | '阴'> = {
  甲: '阳', 乙: '阴', 丙: '阳', 丁: '阴', 戊: '阳',
  己: '阴', 庚: '阳', 辛: '阴', 壬: '阳', 癸: '阴'
};
const WX_SHENG: Record<Wuxing, Wuxing> = { 木: '火', 火: '土', 土: '金', 金: '水', 水: '木' };
const WX_KE: Record<Wuxing, Wuxing> = { 木: '土', 土: '水', 水: '火', 火: '金', 金: '木' };

// 基于日干 + 别的天干 → 十神
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

// 个人 day gan 缓存（避免每次重算 SolarTime）
function memberDayGan(member: MemberProfile): string {
  // 简化路径：从 member.bazi 字符串里取（如"己巳 己巳 乙亥 癸未"第3柱第1字）
  const pillars = member.bazi.split(/\s+/);
  if (pillars[2]) return pillars[2][0];
  return '甲'; // fallback
}

// 用神能否被某 wx 滋养 / 压制
type BodyHelp = 'support' | 'press' | 'drain' | 'neutral';
function computeBodyHelp(fortuneWx: Wuxing, yong: Wuxing | undefined): BodyHelp {
  if (!yong) return 'neutral';
  if (fortuneWx === yong) return 'support';                  // 同气 = 补
  if (WX_SHENG[fortuneWx] === yong) return 'support';        // 生用神 = 补
  if (WX_KE[fortuneWx] === yong) return 'press';             // 克用神 = 压
  if (WX_KE[yong] === fortuneWx) return 'drain';             // 用神被消耗 = 泄
  return 'neutral';
}

// === 十神 → 主题词 + 关键场景 ===
const SHISHEN_DECADE: Record<string, { word: string; story: string; goodFor: string[]; watchOut: string[] }> = {
  比肩: {
    word: '伙伴并肩',
    story: '与同辈相互成就的十年 · 容易在合作中放大自己',
    goodFor: ['找同频伙伴', '加入团队 / 圈子', '共同投资合作'],
    watchOut: ['利益分歧', '过度依赖朋友', '被人情绑架']
  },
  劫财: {
    word: '财气波动',
    story: '财上有进有出 · 防止被人分走',
    goodFor: ['控制现金流', '签合同前看条款', '稳健理财'],
    watchOut: ['冲动投资', '被合作伙伴分钱', '兄弟之间金钱事']
  },
  食神: {
    word: '创造发挥',
    story: '内在想法外化的十年 · 适合做长线作品和表达',
    goodFor: ['做内容 / 作品', '生育 / 育人', '美食与生活方式'],
    watchOut: ['玩物丧志', '过度享受', '不收尾']
  },
  伤官: {
    word: '才华外溢',
    story: '锋芒毕露的十年 · 收益与争议并存',
    goodFor: ['公开表达', '建立个人品牌', '突破规矩做事'],
    watchOut: ['顶撞领导 / 长辈', '官非诉讼', '感情冲突']
  },
  偏财: {
    word: '机会财气',
    story: '横财与人脉的十年 · 短期机会多但要选',
    goodFor: ['抓时机做项目', '拓展人脉', '副业 / 跨界'],
    watchOut: ['投机失手', '感情外的诱惑', '管不住开销']
  },
  正财: {
    word: '稳进积累',
    story: '稳扎稳打的十年 · 工作型财富积累',
    goodFor: ['深耕本职', '婚姻稳定期', '置业 / 长期资产'],
    watchOut: ['过于保守错过机会', '为钱忽视家庭', '工作太满']
  },
  七杀: {
    word: '硬仗与突破',
    story: '挑战与压力的十年 · 容易遇强敌但能逼出能力',
    goodFor: ['做有难度的事', '换平台 / 跳槽', '武学 / 体能训练'],
    watchOut: ['身体透支', '官司 / 是非', '冲动决策']
  },
  正官: {
    word: '规矩与位置',
    story: '走流程 / 公开身份 / 责任增大的十年',
    goodFor: ['职场晋升', '考公 / 考证', '婚姻 / 法律手续'],
    watchOut: ['被规矩束缚', '官场是非', '过于在意他人评价']
  },
  偏印: {
    word: '独立思考',
    story: '冷门视角 · 适合做研究或非主流路径',
    goodFor: ['深度阅读', '冷门赛道研究', '独自创作'],
    watchOut: ['脱离群体', '想得多做得少', '与母系长辈疏远']
  },
  正印: {
    word: '学习吸收',
    story: '受教 / 学历 / 长辈支持的十年',
    goodFor: ['学习深造', '亲近长辈', '读书写作'],
    watchOut: ['过度依赖庇护', '不愿走出舒适区', '虚名']
  }
};

const SHISHEN_YEAR: Record<string, { word: string; story: string; events: string[] }> = {
  比肩: { word: '同伴年', story: '今年容易遇到同频的人 · 合作机会多', events: ['团队成事', '老朋友重聚', '加入新圈子'] },
  劫财: { word: '破财年', story: '今年钱财波动 · 守为主', events: ['冲动消费', '合作分歧', '兄弟事'] },
  食神: { word: '表达年', story: '今年是创作和表达的窗口', events: ['作品 / 内容产出', '生育 / 教学', '生活方式更新'] },
  伤官: { word: '锋芒年', story: '才华显露 · 但要管住嘴', events: ['公开亮相', '突破规矩', '与权威摩擦'] },
  偏财: { word: '机会年', story: '今年短期机会多 · 但要选', events: ['副业 / 项目', '人脉拓展', '小赚但易花'] },
  正财: { word: '稳财年', story: '今年靠本职能稳积累', events: ['加薪 / 升职', '置业', '婚姻稳定']  },
  七杀: { word: '挑战年', story: '今年压力大 · 但能突破', events: ['硬仗 / 难题', '换平台', '健康警钟'] },
  正官: { word: '规矩年', story: '今年走流程 / 身份升级', events: ['晋升 / 考证', '婚姻登记', '法律手续'] },
  偏印: { word: '思考年', story: '今年适合深读和独处', events: ['深度学习', '冷门研究', '出走 / 独立'] },
  正印: { word: '受教年', story: '今年长辈与学业上有支持', events: ['学历 / 进修', '长辈帮助', '家庭温暖'] }
};

const SHISHEN_MONTH: Record<string, string> = {
  比肩: '本月易和同辈共事 · 合作中找节奏',
  劫财: '本月钱财注意 · 别冲动消费',
  食神: '本月可以输出作品 · 创作友好',
  伤官: '本月话锋利 · 注意场合',
  偏财: '本月有短机会 · 抓节点',
  正财: '本月稳推本职 · 不必跳跃',
  七杀: '本月有硬仗 · 顶住压',
  正官: '本月走流程 · 适合谈正事',
  偏印: '本月独处思考 · 别强社交',
  正印: '本月接受指导 · 别独自硬扛'
};

const HELP_LABEL: Record<BodyHelp, { label: string; cn: string }> = {
  support: { label: '顺风期', cn: '气场补身 · 用神被滋养' },
  press:   { label: '逆风期', cn: '气场压身 · 容易感到累' },
  drain:   { label: '泄气期', cn: '气场在外散 · 输出多但易透支' },
  neutral: { label: '平稳期', cn: '气场中性 · 看主动性' }
};

// === Public API ===

export interface FortuneTheme {
  shishen: string;       // 食神 / 偏财 / ...
  themeWord: string;     // "创造发挥"
  bodyHelp: BodyHelp;
  helpLabel: string;     // "顺风期" / "逆风期" / ...
  narrative: string;     // 100-150 字
  goodFor: string[];
  watchOut: string[];
}

export function computeDecadeTheme(member: MemberProfile, ganZhi: string): FortuneTheme {
  const dayGan = memberDayGan(member);
  const fortuneGan = ganZhi[0] ?? '甲';
  const shishen = getShiShen(dayGan, fortuneGan);
  const fortuneWx = TIANGAN_WUXING[fortuneGan];
  const bodyHelp = computeBodyHelp(fortuneWx, member.yong);
  const tone = SHISHEN_DECADE[shishen] ?? SHISHEN_DECADE.正官;
  const help = HELP_LABEL[bodyHelp];
  const narrative =
    `你正走${shishen}运（${ganZhi}）· 这十年的核心命题是${tone.word}。` +
    `${tone.story}。` +
    `气场属${help.label} · ${help.cn}。` +
    `建议把这十年的精力压在一条主线上 · 别多面分散。`;
  return {
    shishen,
    themeWord: tone.word,
    bodyHelp,
    helpLabel: help.label,
    narrative,
    goodFor: tone.goodFor,
    watchOut: tone.watchOut
  };
}

export function computeYearTheme(member: MemberProfile, ganZhi: string, year: number): FortuneTheme {
  const dayGan = memberDayGan(member);
  const fortuneGan = ganZhi[0] ?? '甲';
  const shishen = getShiShen(dayGan, fortuneGan);
  const fortuneWx = TIANGAN_WUXING[fortuneGan];
  const bodyHelp = computeBodyHelp(fortuneWx, member.yong);
  const tone = SHISHEN_YEAR[shishen] ?? SHISHEN_YEAR.正官;
  const help = HELP_LABEL[bodyHelp];
  const narrative =
    `${year} 年（${ganZhi}）是你的${shishen}年 · ${tone.word}。` +
    `${tone.story}。` +
    `年份气场属${help.label} · ${help.cn}。`;
  return {
    shishen,
    themeWord: tone.word,
    bodyHelp,
    helpLabel: help.label,
    narrative,
    goodFor: tone.events,
    watchOut: SHISHEN_DECADE[shishen]?.watchOut ?? []
  };
}

export function computeMonthTheme(member: MemberProfile, ganZhi: string, monthIndex: number): FortuneTheme {
  const dayGan = memberDayGan(member);
  const fortuneGan = ganZhi[0] ?? '甲';
  const shishen = getShiShen(dayGan, fortuneGan);
  const fortuneWx = TIANGAN_WUXING[fortuneGan];
  const bodyHelp = computeBodyHelp(fortuneWx, member.yong);
  const tone = SHISHEN_MONTH[shishen] ?? '本月稳进 · 不强求节奏';
  const help = HELP_LABEL[bodyHelp];
  const narrative =
    `${monthIndex} 月（${ganZhi}）· ${shishen} · ${tone}。` +
    `本月${help.label} · ${help.cn}。`;
  return {
    shishen,
    themeWord: tone,
    bodyHelp,
    helpLabel: help.label,
    narrative,
    goodFor: SHISHEN_YEAR[shishen]?.events.slice(0, 2) ?? [],
    watchOut: SHISHEN_DECADE[shishen]?.watchOut.slice(0, 2) ?? []
  };
}
