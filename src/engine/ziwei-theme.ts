// 紫微宫位主题叙事
// 基于主星组合 + 宫位 → 80-120 字主题解读
// 不调 LLM · 模板规则

import type { ZiweiPalace } from './adapters/iztro';

// === 14 主星 → 性格特质 + 角色定位 ===
const MAJOR_STAR_TONE: Record<string, string> = {
  紫微: '帝王星 · 主导力强 · 有自尊',
  天机: '智多星 · 善思考 · 灵活多变',
  太阳: '光明星 · 热情外放 · 有正义感',
  武曲: '财星 · 刚毅果决 · 务实理财',
  天同: '福星 · 随和易满足 · 推动力略弱',
  廉贞: '次桃花 · 情感纠结 · 有戏剧性',
  天府: '库星 · 稳重持重 · 善守资源',
  太阴: '柔星 · 细腻情感 · 体察入微',
  贪狼: '桃花星 · 多才艺 · 应酬高手',
  巨门: '口舌星 · 言辞犀利 · 适合表达',
  天相: '印星 · 辅佐之才 · 公正讲理',
  天梁: '荫星 · 老成持重 · 善照顾人',
  七杀: '将星 · 勇于挑战 · 不喜束缚',
  破军: '先锋星 · 开拓变革 · 不安现状'
};

// === 12 宫位 → 在生活里看的是什么 ===
const PALACE_CONTEXT: Record<string, { aspect: string; story: string }> = {
  命宫:   { aspect: '一生主轴',    story: '性格底色 · 看你是哪一类型的人' },
  兄弟:   { aspect: '同辈关系',    story: '朋友圈层 · 与兄弟姐妹相处' },
  夫妻:   { aspect: '婚恋伴侣',    story: '长期感情 · 配偶类型' },
  子女:   { aspect: '子嗣创造',    story: '后代 / 学生 / 创作产出' },
  财帛:   { aspect: '财富现金流',  story: '钱怎么进 / 适合什么财源' },
  疾厄:   { aspect: '健康情绪',    story: '身体弱点 / 情绪压力来源' },
  迁移:   { aspect: '外出与缘分',  story: '远行机会 / 在外的际遇' },
  奴仆:   { aspect: '下属朋友圈',  story: '能用得动的人 / 圈层人脉' },
  官禄:   { aspect: '事业职位',    story: '工作类型 / 适合的赛道' },
  田宅:   { aspect: '不动产居家',  story: '住所 / 家庭环境' },
  福德:   { aspect: '内在福气',    story: '精神享受 / 兴趣方向' },
  父母:   { aspect: '长辈上司缘',  story: '与父母 / 上司 / 老师的关系' }
};

export interface PalaceNarrative {
  aspect: string;        // 一生主轴 / 婚恋伴侣
  story: string;         // 这宫看的是什么
  trait: string;         // 由主星推出的特质
  narrative: string;     // 80-120 字
  hasMajorStar: boolean; // 没主星 = 借对宫
}

export function paceNarrative(palace: ZiweiPalace): PalaceNarrative {
  const ctx = PALACE_CONTEXT[palace.name] ?? { aspect: palace.name, story: '生活中的这一面' };
  const traits = palace.majorStars
    .map(s => MAJOR_STAR_TONE[s])
    .filter(Boolean);
  if (traits.length === 0) {
    return {
      aspect: ctx.aspect,
      story: ctx.story,
      trait: '此宫无主星 · 多看对宫借力',
      narrative: `${palace.name}（${palace.heavenlyStem}${palace.earthlyBranch}）是你的${ctx.aspect}。${ctx.story}。这宫无主星，需要看对宫借力，整体气场偏受外界影响。`,
      hasMajorStar: false
    };
  }
  const trait = traits.join(' / ');
  const starList = palace.majorStars.join('、');
  return {
    aspect: ctx.aspect,
    story: ctx.story,
    trait,
    narrative: `${palace.name}（${palace.heavenlyStem}${palace.earthlyBranch}）是你的${ctx.aspect}。落主星：${starList}。${trait}。${ctx.story}是这宫主要看的方向。`,
    hasMajorStar: true
  };
}

// === 与八字的对照说明（固定文案） ===
export const ZIWEI_VS_BAZI_NOTE = {
  bazi: '八字看的是「五行流转 + 用神调候」· 适合判断当下吉凶 / 流日强弱',
  ziwei: '紫微看的是「12 宫位 + 14 主星」· 适合看一生命题 / 不同生活面的命格底色',
  conclusion: '两套体系不互斥 · 八字是流向 · 紫微是结构 · 同时看更立体'
};
