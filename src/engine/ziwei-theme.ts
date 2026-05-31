// 紫微宫位主题叙事
// 基于主星组合 + 宫位 → 多层解读
// 不调 LLM · 模板规则
//
// 输出层次（按 牛牛 / 嘻嘻视角）：
// 1. aspect       一生主轴 / 同辈关系（粗分类）
// 2. meaning      宫意：这宫"是什么" · 一句话普及
// 3. scope        适用范围：在生活里具体看哪些事
// 4. trait        主星组合推出的特质
// 5. narrative    80-120 字术语解读
// 6. plainNarrative  牛牛风白话：直接 / 实用主义 / 中英混
// 7. plainFocus      先看哪一个点

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

// === 12 宫位 → aspect + story（粗分类）===
const PALACE_CONTEXT: Record<string, { aspect: string; story: string }> = {
  命宫:   { aspect: '一生主轴',    story: '性格底色 · 看你是哪一类型的人' },
  兄弟:   { aspect: '同辈关系',    story: '朋友圈层 · 与兄弟姐妹相处' },
  夫妻:   { aspect: '婚恋伴侣',    story: '长期感情 · 配偶类型' },
  子女:   { aspect: '子嗣创造',    story: '后代 / 学生 / 创作产出' },
  财帛:   { aspect: '财富现金流',  story: '钱怎么进 / 适合什么财源' },
  疾厄:   { aspect: '健康情绪',    story: '身体弱点 / 情绪压力来源' },
  迁移:   { aspect: '外出与缘分',  story: '远行机会 / 在外的际遇' },
  奴仆:   { aspect: '下属朋友圈',  story: '能用得动的人 / 圈层人脉' },
  仆役:   { aspect: '下属朋友圈',  story: '能用得动的人 / 圈层人脉' },
  官禄:   { aspect: '事业职位',    story: '工作类型 / 适合的赛道' },
  田宅:   { aspect: '不动产居家',  story: '住所 / 家庭环境' },
  福德:   { aspect: '内在福气',    story: '精神享受 / 兴趣方向' },
  父母:   { aspect: '长辈上司缘',  story: '与父母 / 上司 / 老师的关系' }
};

// === 12 宫 · 宫意（一句话普及）+ 适用范围（具体看哪些事）===
const PALACE_META: Record<string, { meaning: string; scope: string }> = {
  命宫: {
    meaning: '你这个人本身的底色 · 一生主轴的起点 · 性格 / 思维 / 应对世界的方式',
    scope: '看你天生是哪一类人 · 反应模式 / 价值取向 / 一生主线方向'
  },
  兄弟: {
    meaning: '同辈关系 · 朋友 / 兄弟姐妹 / 团队伙伴 · 跟你平级的人',
    scope: '看你和同辈怎么相处 · 朋友圈是什么样 / 团队怎么配合 / 谁推得动你'
  },
  夫妻: {
    meaning: '伴侣 / 长期感情 · 不只是结婚对象 · 也包括所有深度的双人关系',
    scope: '看你吸引什么样的人 / 在长期关系里的姿态 / 容易卡住的点'
  },
  子女: {
    meaning: '后代 / 学生 / 创作产出 · 凡是"你输出 → 别人接住"的关系都看这',
    scope: '看你的创造力 / 教学传承 / 能不能开个项目并把它收住'
  },
  财帛: {
    meaning: '钱怎么进 · 收入流的形态 · 不只看赚多少 · 看赚钱的方式',
    scope: '看你适合什么财源（本职 / 副业 / 投资 / 资产）· 现金流节奏'
  },
  疾厄: {
    meaning: '身体弱点 + 情绪压力来源 · 哪里容易透支 · 哪种压力最伤你',
    scope: '看健康风险方向 / 情绪触发点 / 长期需要警惕的地方'
  },
  迁移: {
    meaning: '出门在外的运 · 远行 / 跨地域 / 与外人接触的命题',
    scope: '看你出门的际遇 / 跳槽 / 出国 / 和陌生人合作的运势'
  },
  奴仆: {
    meaning: '下属 / 部属 / 远朋 · 你能调动谁 · 谁愿意为你做事',
    scope: '看你的权威感 / 团队管理 / 能借力的圈子人脉'
  },
  仆役: {
    meaning: '下属 / 部属 / 远朋 · 你能调动谁 · 谁愿意为你做事',
    scope: '看你的权威感 / 团队管理 / 能借力的圈子人脉'
  },
  官禄: {
    meaning: '事业 / 工作 / 职场身份 · 不只看升不升 · 看你适合什么赛道',
    scope: '看你的职业路径 / 适合做什么类型的工作 / 职场上能走多远'
  },
  田宅: {
    meaning: '不动产 / 家产 / 居家环境 · 长期能积累下来的硬资产',
    scope: '看置业 / 家庭环境 / 长辈传承 / 居住对你的影响'
  },
  福德: {
    meaning: '内在精神 / 享受 / 福分 · 你真正快乐 / 自洽的来源',
    scope: '看你内在追求 / 兴趣方向 / 怎样过得舒服 / 享福的能力'
  },
  父母: {
    meaning: '长辈 / 上司 / 庇护 · 位高于你 + 罩着你的人',
    scope: '看你和父母 / 上司 / 老师的缘分 / 能拿到多少照应和资源'
  }
};

export interface PalaceNarrative {
  aspect: string;
  story: string;
  meaning: string;       // 宫意 · 一句话普及
  scope: string;         // 适用范围 · 具体看哪些事
  trait: string;
  narrative: string;
  plainNarrative: string; // 牛牛风白话
  plainFocus: string;
  hasMajorStar: boolean;
}

// 大白话主星风格（直接 / 不绕弯 / 通俗易懂）
const MAJOR_STAR_PLAIN_NIU: Record<string, string> = {
  紫微: '习惯自己拿主意 · 不爱被人催 · 遇事顶在前面',
  天机: '脑子转得快 · 喜欢琢磨 · 但容易想多反而拿不定主意',
  太阳: '直来直去 · 话摊开讲 · 没什么藏的 · 容易说过头',
  武曲: '务实硬核 · 看结果和数字 · 但有时候不留情面',
  天同: '求稳过日子 · 节奏慢 · 长跑型 · 短期冲不太上去',
  廉贞: '情绪起伏大 · 想得多 · 容易反复纠结 · 也会自己跟自己较劲',
  天府: '稳重保守 · 擅长守成 · 但主动出击不是强项',
  太阴: '敏感细腻 · 先感受再动手 · 心思丰富 · 但容易被气氛带跑',
  贪狼: '人缘好 · 欲望强 · 机会一堆 · 但容易分心 · 该专心时要狠下心',
  巨门: '说话犀利 · 一针见血 · 但也容易得罪人 · 嘴是武器也是伤害',
  天相: '讲规矩讲公平 · 适合做协调 · 但有时候被原则卡得太死',
  天梁: '责任心强 · 爱照顾人 · 但有时候管太多反而把自己累着',
  七杀: '冲劲大 · 遇事先上再说 · 但容易硬刚把自己耗光',
  破军: '不爱按规矩走 · 喜欢开新坑 · 但收尾常常掉链子'
};

function buildPlainNarrativeNiu(palace: ZiweiPalace, scope: string): { plainNarrative: string; plainFocus: string } {
  if (palace.majorStars.length === 0) {
    return {
      plainNarrative: `这宫没主星 = 没固定人设 · 表现浮动看环境 · 别一根筋按"我天生就是某种人"硬走 · 实际看对宫借力 + 当下的大运怎么走`,
      plainFocus: `先看对宫给的力量 · 自己别先下定论`
    };
  }

  const firstStar = palace.majorStars[0];
  const firstStyle = MAJOR_STAR_PLAIN_NIU[firstStar] ?? '有自己的主导特征';
  const second = palace.majorStars[1];
  const secondStyle = second ? MAJOR_STAR_PLAIN_NIU[second] : '';

  const head = `这宫你的默认表现像「${firstStar}」 · ${firstStyle}`;
  const middle = secondStyle ? `；又叠了「${second}」 · ${secondStyle}` : '';
  const tail = `。${scope}`;

  return {
    plainNarrative: `${head}${middle}${tail}`,
    plainFocus: `${firstStar} 的反应 = 你的本能反应 · 想换打法先认清这是惯性 · 才有可能跳出去`
  };
}

export function paceNarrative(palace: ZiweiPalace): PalaceNarrative {
  const ctx = PALACE_CONTEXT[palace.name] ?? { aspect: palace.name, story: '生活中的这一面' };
  const meta = PALACE_META[palace.name] ?? { meaning: ctx.story, scope: ctx.story };
  const traits = palace.majorStars
    .map(s => MAJOR_STAR_TONE[s])
    .filter(Boolean);
  const plain = buildPlainNarrativeNiu(palace, meta.scope);

  if (traits.length === 0) {
    return {
      aspect: ctx.aspect,
      story: ctx.story,
      meaning: meta.meaning,
      scope: meta.scope,
      trait: '此宫无主星 · 多看对宫借力',
      narrative: `${palace.name}（${palace.heavenlyStem}${palace.earthlyBranch}）是你的${ctx.aspect}。${ctx.story}。这宫无主星，需要看对宫借力，整体气场偏受外界影响。`,
      plainNarrative: plain.plainNarrative,
      plainFocus: plain.plainFocus,
      hasMajorStar: false
    };
  }
  const trait = traits.join(' / ');
  const starList = palace.majorStars.join('、');
  return {
    aspect: ctx.aspect,
    story: ctx.story,
    meaning: meta.meaning,
    scope: meta.scope,
    trait,
    narrative: `${palace.name}（${palace.heavenlyStem}${palace.earthlyBranch}）是你的${ctx.aspect}。落主星：${starList}。${trait}。${ctx.story}是这宫主要看的方向。`,
    plainNarrative: plain.plainNarrative,
    plainFocus: plain.plainFocus,
    hasMajorStar: true
  };
}

// === 紫微入门 · 给新手快速建立认知框架 ===
export const ZIWEI_PRIMER = {
  twelvePalaces: {
    title: '12 宫 · 把人生切成 12 个面来看',
    body: '紫微把你的一生拆成 12 个领域 · 每个宫管一面 · 同样一颗主星落在不同宫 · 表现完全不同。',
    list: [
      { name: '命宫',     scope: '你这个人本身 / 性格底色' },
      { name: '兄弟宫',   scope: '同辈关系 / 朋友圈层' },
      { name: '夫妻宫',   scope: '伴侣 / 长期感情' },
      { name: '子女宫',   scope: '后代 / 创作产出' },
      { name: '财帛宫',   scope: '钱怎么进 / 现金流' },
      { name: '疾厄宫',   scope: '健康 / 情绪压力' },
      { name: '迁移宫',   scope: '出门在外 / 跨地域' },
      { name: '奴仆宫',   scope: '下属 / 部属 / 远朋' },
      { name: '官禄宫',   scope: '事业 / 工作赛道' },
      { name: '田宅宫',   scope: '不动产 / 家产' },
      { name: '福德宫',   scope: '内在享受 / 福分' },
      { name: '父母宫',   scope: '长辈 / 上司 / 庇护' }
    ]
  },
  soulVsBody: {
    title: '命宫 vs 身宫 · 两个不同的"我"',
    body: '命宫 = 先天性格底色 · 你天生是哪一类人。身宫 = 后天能量落点 · 你在哪个领域上花最多精力 / 最容易被现实命题塑形。',
    rows: [
      { label: '命宫',   text: '一生主轴 · 不变 · 决定你的反应模式和价值观' },
      { label: '身宫',   text: '后天聚焦 · 35 岁后越来越强 · 落在哪宫 = 那一面会主导你的人生重心' },
      { label: '关键',   text: '身宫永远落在 命/夫妻/财帛/迁移/官禄/福德 这 6 宫之一 · 不在父母 / 兄弟 / 子女 / 田宅 / 疾厄 / 仆役' }
    ]
  },
  fiveElements: {
    title: '五行局 · 你的运势节奏速度',
    body: '五行局是你的"运势走时单位" · 决定大运每一步走多少年 + 起运的早晚。',
    rows: [
      { label: '水二局', text: '每步 2 年 · 反应最快 · 起运也最早' },
      { label: '木三局', text: '每步 3 年 · 偏快' },
      { label: '金四局', text: '每步 4 年 · 适中' },
      { label: '土五局', text: '每步 5 年 · 偏慢' },
      { label: '火六局', text: '每步 6 年 · 反应最慢 · 大器晚成型' }
    ]
  },
  starTypes: {
    title: '主星 / 辅星 / 杂曜 · 怎么读',
    body: '紫微有 100+ 颗星 · 但只有少数关键。主星 14 颗（紫微 / 天机 / 太阳 ... ）· 决定一宫的主调。辅星 14 颗（左辅 / 右弼 / 文昌 / 文曲 ... ）· 加分项。煞星 6 颗（擎羊 / 陀罗 / 火星 / 铃星 / 地空 / 地劫 ）· 减分项。其他杂曜次要。',
    rows: [
      { label: '主星',   text: '14 颗 · 决定那宫的"主调" · 优先看' },
      { label: '辅星',   text: '14 颗 · 加成型 · 让那宫变好 · 左辅右弼最常见' },
      { label: '煞星',   text: '6 颗 · 减分型 · 擎羊 / 陀罗 / 火铃 / 空劫' },
      { label: '亮度',   text: '庙 > 旺 > 得 > 利 > 平 > 不得 > 陷 · 越亮主星发挥越好' }
    ]
  }
};

// === 与八字的对照说明（固定文案） ===
export const ZIWEI_VS_BAZI_NOTE = {
  bazi: '八字看的是「五行流转 + 用神调候」· 适合判断当下吉凶 / 流日强弱',
  ziwei: '紫微看的是「12 宫位 + 14 主星」· 适合看一生命题 / 不同生活面的命格底色',
  conclusion: '两套体系不互斥 · 八字是流向 · 紫微是结构 · 同时看更立体'
};
