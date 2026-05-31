// 塔罗 × 用户问题融合算法（不调 LLM · 多维信号 × 模板规则）
//
// 设计原则（来自成熟塔罗师常规解读手法）：
// 1. 不直接 yes/no · 把问题"翻译"到牌的能量框架里
// 2. 大阿尔卡纳 = 命题级（人生主轴）/ 小阿尔卡纳 = 当下层（具体局面）
// 3. 小阿尔卡纳 = suit + number 共同决定能量类型：
//      wands 火 = 行动 / 推进 / 激情
//      cups 水 = 感受 / 关系 / 情感
//      swords 风 = 思辨 / 沟通 / 冲突
//      pentacles 土 = 物质 / 资源 / 稳定
// 4. 数字阶段：1 起点 / 2-3 形成 / 4 稳 / 5 危机 / 6 平衡 / 7 抉择
//             8 内化 / 9 接近完成 / 10 闭环 / 11-14 宫廷牌（人）
// 5. 正位 = 顺势 / 逆位 = 反向 · 内在 · 阻塞 · 过度
// 6. 解读 = "重述问题" → "牌的视角" → "落到行动"，不机械拼接

import type { TarotCardData, TarotSuit } from '../data/tarot-rws-78';

export type Matter =
  | 'decision'    // 要不要 · 决定
  | 'relation'    // 关系 · 感情
  | 'money'       // 钱 · 项目 · 合同
  | 'timing'      // 时机 · 何时
  | 'speech'      // 表达 · 沟通
  | 'health'      // 健康 · 身体
  | 'general';    // 一般

const MATTER_RULES: Array<{ matter: Matter; pattern: RegExp }> = [
  { matter: 'relation', pattern: /(关系|TA|他|她|对象|分手|表白|结婚|吵架|家人|父母|朋友|同事|相处|喜欢|爱)/ },
  { matter: 'money',    pattern: /(钱|签|合同|买|卖|项目|价格|涨|跌|理财|投资|工资|奖金|生意|股票|赚)/ },
  { matter: 'timing',   pattern: /(时机|时间|什么时候|多久|快|慢|早|晚|现在|今天|何时)/ },
  { matter: 'speech',   pattern: /(说|讲|聊|发|沟通|表达|话|回复|回信|告诉|提)/ },
  { matter: 'health',   pattern: /(身体|健康|累|睡|生病|医生|疼|休息|疲劳|焦虑)/ },
  { matter: 'decision', pattern: /(适合|要不要|要|该|该不该|应不应该|去不去|做不做|换|辞|跳)/ }
];

export function detectMatter(q: string): Matter {
  for (const r of MATTER_RULES) {
    if (r.pattern.test(q)) return r.matter;
  }
  return 'general';
}

// === Suit × Matter · 把用户问题"翻译"成牌的能量框架 ===
// 不是回答问题，是说"这张牌看待你这个问题的角度是 XX"
const SUIT_MATTER_FRAME: Record<TarotSuit, Record<Matter, string>> = {
  wands: {
    decision: '"该不该出手"——看推进力够不够、是不是真有热度',
    relation: '"还有没有热度"——看主动性、行动是不是跟得上',
    money:    '"该不该投/谈"——看是不是真敢出手',
    timing:   '"现在节奏对不对"——能否跟上推进的速度',
    speech:   '"敢不敢直说"——直接表达 vs 留有余地',
    health:   '"火气与冲劲"——能量水平与体力',
    general:  '"行动力 / 推进方向"是关键'
  },
  cups: {
    decision: '"心是不是真愿意"——情感而非理性占主导',
    relation: '"感受层面是怎样"——彼此情绪是否到位',
    money:    '"这事让你舒服吗"——钱背后的情感成本',
    timing:   '"心境到位了吗"——情绪而非时间窗口',
    speech:   '"用感受说话还是用脑子说话"',
    health:   '"情绪 / 心理状态"',
    general:  '"感受 / 直觉信号"是关键'
  },
  swords: {
    decision: '"想清楚了吗"——逻辑、利弊、风险有没有看透',
    relation: '"沟通是不是有结"——讲话方式 / 误解 / 边界',
    money:    '"账算明白没"——细节、合同条款、隐性成本',
    timing:   '"看清局面没"——信息够了再动',
    speech:   '"说什么话不会受伤"——选词与节奏',
    health:   '"想得太多 / 焦虑积压"',
    general:  '"认知 / 想法 / 边界"是关键'
  },
  pentacles: {
    decision: '"物质代价划算吗"——长线资源与稳定性',
    relation: '"踏实程度"——彼此能不能托底',
    money:    '"基础稳不稳"——现金流 / 储备 / 长线',
    timing:   '"准备工作做够了吗"——基础铺好再上',
    speech:   '"是不是有据可依"——证据、数据、合同',
    health:   '"身体 / 物质保障"',
    general:  '"稳定性 / 资源面"是关键'
  }
};

// === 数字阶段 · 暗示这件事处在"周期的哪一段" ===
const NUMBER_STAGE: Record<number, string> = {
  1:  '起点 · 火种刚冒',
  2:  '初遇 · 两股力对话',
  3:  '初成 · 雏形显现',
  4:  '稳定 · 阶段性守护',
  5:  '危机 · 测试与摩擦',
  6:  '平衡 · 给与得在调和',
  7:  '抉择 · 多个路口',
  8:  '内化 · 累积与磨炼',
  9:  '近成 · 整合阶段',
  10: '闭环 · 一段完成',
  11: '侍者 · 探索者 / 学徒',
  12: '骑士 · 行动者 / 推进',
  13: '皇后 · 内化滋养',
  14: '国王 · 掌控整合'
};

// === 大阿尔卡纳 · 命题级重述 ===
// 大阿在问题里出现 = 这件事不是技术问题、是"人生命题问题"
const MAJOR_LIFE_THEME: Record<number, string> = {
  0:  '回到"轻装上路"的命题：成本低、可逆 · 别想太重',
  1:  '回到"工具与意图"的命题：手里资源够不够整合成一个动作',
  2:  '回到"听内在 vs 听外部信息"的命题',
  3:  '回到"让事情有机生长 vs 强推"的命题',
  4:  '回到"用规则压住混乱"的命题：先定边界再推进',
  5:  '回到"自己想 vs 走现成路径"的命题',
  6:  '回到"把偏好讲清楚"的命题：模糊在消耗你',
  7:  '回到"聚焦一个目标 vs 多线分散"的命题',
  8:  '回到"温柔坚持 vs 蛮力对抗"的命题',
  9:  '回到"独处看清 vs 急着输出"的命题',
  10: '回到"看周期 vs 只看当下情绪"的命题',
  11: '回到"把模糊地带说清楚"的命题',
  12: '回到"换视角 vs 硬推"的命题',
  13: '回到"该结束的让它结束"的命题',
  14: '回到"调和 vs 极端"的命题',
  15: '回到"看清自己被什么绑住"的命题',
  16: '回到"假结构倒掉反而是机会"的命题',
  17: '回到"小而连续 vs 突然爆发"的命题',
  18: '回到"不在情绪里做决定"的命题',
  19: '回到"把成果放出来接受反馈"的命题',
  20: '回到"该回应的就一次回应"的命题',
  21: '回到"画明确句号 · 才能开下一段"的命题'
};

interface CardSignal {
  tier: 'major' | 'minor';
  suit: TarotSuit | null;
  number: number | null;
  stage: string | null;
  reversed: boolean;
  positionTone: string; // 顺势 / 反向内在 / etc
}

function analyzeCard(card: TarotCardData, reversed: boolean): CardSignal {
  return {
    tier: card.arcana,
    suit: card.suit ?? null,
    number: card.number ?? null,
    stage: card.number ? NUMBER_STAGE[card.number] ?? null : null,
    reversed,
    positionTone: reversed ? '反向 · 内在 / 阻塞 / 过度' : '顺势 · 外显 / 推进'
  };
}

export interface QuestionFusion {
  question: string;
  angle: string;        // 这张牌切的角度（一行 chip）
  restatement: string;  // 把问题重述到牌的视角
  insight: string;      // 牌说什么 + 数字阶段 / 主题
  landing: string;      // 落到具体行动 · 不再机械拼 advice + action
}

export function buildQuestionFusion(
  question: string,
  card: TarotCardData,
  isReversed: boolean
): QuestionFusion {
  const q = question.trim();
  const matter = detectMatter(q);
  const sig = analyzeCard(card, isReversed);

  // === angle · 一行 chip：层级 · 能量域 · 阶段 · 正逆 ===
  const angleParts: string[] = [];
  if (sig.tier === 'major') {
    angleParts.push('大阿尔卡纳 · 命题级');
  } else if (sig.suit) {
    const suitDomain = { wands: '权杖 / 行动', cups: '圣杯 / 感受', swords: '宝剑 / 思辨', pentacles: '钱币 / 物质' }[sig.suit];
    angleParts.push(suitDomain);
  }
  if (sig.stage) angleParts.push(sig.stage);
  angleParts.push(sig.reversed ? '逆位 · 反向' : '正位 · 顺势');
  const angle = angleParts.join(' · ');

  // === restatement · 把问题翻译成牌的视角 ===
  let restatement: string;
  if (sig.tier === 'major') {
    const lifeTheme = MAJOR_LIFE_THEME[card.id] ?? '看清这件事在你人生里的位置';
    restatement = `这不是技术题 · 是人生命题：${lifeTheme}`;
  } else if (sig.suit) {
    const frame = SUIT_MATTER_FRAME[sig.suit][matter];
    restatement = `这张牌把你的问题翻成 ${frame}`;
  } else {
    restatement = `把问题放到 ${card.keywords[0] ?? '当下'} 的视角下看`;
  }

  // === insight · 牌的核心一句 + 阶段提示 + 正逆调整 ===
  const insightCore = sig.reversed ? card.reversed : card.upright;
  const stageHint = sig.stage ? ` 当前阶段：${sig.stage}。` : '';
  const insight = `${insightCore}${stageHint}`;

  // === landing · matter × signal 的真正解读 + 一个具体动作 ===
  const landing = buildLanding(matter, sig, card, q);

  return { question: q, angle, restatement, insight, landing };
}

// landing 模板：matter × tier × polarity 三维分支
// 每个分支用牌特有的 keywords / advice / action 填进去（避免太空泛）
function buildLanding(
  matter: Matter,
  sig: CardSignal,
  card: TarotCardData,
  _q: string
): string {
  const kw = card.keywords[0] ?? '';
  const kw2 = card.keywords[1] ?? kw;
  const advice = card.advice;
  const action = card.action;

  // 大阿尔卡纳：命题级答疑（不直接 yes/no · 让 Nic 自己看清命题）
  if (sig.tier === 'major') {
    if (sig.reversed) {
      return `命题层在卡住：${advice} · 不是表面那个动作不对，是你和"${kw}"的关系还没理顺。今天先做：${action}`;
    }
    return `命题方向是清的：${advice} · 你问的具体事是这条命题的一个支点。今天先做：${action}`;
  }

  // 小阿尔卡纳：按 suit × matter 给具体口径
  const suit = sig.suit;
  if (!suit) {
    return `${advice} 今天先做：${action}`;
  }

  const stageWord = ''; // 阶段已经在 angle chip 显示 · landing 内不再重复
  const polarityHint = sig.reversed ? '注意是反向 / 内在版本' : '走顺势版本';

  // 决定 / 要不要型
  if (matter === 'decision') {
    if (suit === 'wands') {
      return sig.reversed
        ? `推进力还没到 · 别硬冲${stageWord}。${advice} 先做小动作探一下：${action}`
        : `推进的窗口在${stageWord} · ${advice} 落到具体：${action}`;
    }
    if (suit === 'cups') {
      return sig.reversed
        ? `心里其实没那么愿意${stageWord} · ${advice} 先听自己一句：${action}`
        : `心是认这事的${stageWord} · ${advice} 顺着感受走：${action}`;
    }
    if (suit === 'swords') {
      return sig.reversed
        ? `逻辑还没理清就别动${stageWord} · ${advice} 先做：${action}`
        : `理性看是清的${stageWord} · ${advice} 把判断落地：${action}`;
    }
    return sig.reversed
      ? `物质基础不稳 · 先别拍板${stageWord}。${advice} 补一步：${action}`
      : `资源面够稳${stageWord} · ${advice} 落地：${action}`;
  }

  // 关系型
  if (matter === 'relation') {
    if (suit === 'wands') {
      return sig.reversed
        ? `关系里热度在退${stageWord} · 别硬推。${advice} 试一下：${action}`
        : `关系里能主动${stageWord} · ${advice} 具体：${action}`;
    }
    if (suit === 'cups') {
      return sig.reversed
        ? `感受层有积压${stageWord} · ${advice} 今天：${action}`
        : `感受层是通的${stageWord} · ${advice} 顺势：${action}`;
    }
    if (suit === 'swords') {
      return sig.reversed
        ? `沟通有结${stageWord} · 先不解释 · ${advice} 先做：${action}`
        : `话该说清的时候${stageWord} · ${advice} 具体：${action}`;
    }
    return sig.reversed
      ? `对方是不是真踏实你心里有数${stageWord} · ${advice} 行动：${action}`
      : `关系底子在${stageWord} · ${advice} 落到日常：${action}`;
  }

  // 钱 / 项目型
  if (matter === 'money') {
    if (suit === 'wands') {
      return sig.reversed
        ? `项目推进的劲头不足${stageWord} · 别加码。${advice} 先：${action}`
        : `推进窗口在${stageWord} · ${advice} 具体动作：${action}`;
    }
    if (suit === 'cups') {
      return sig.reversed
        ? `这笔钱让你不舒服${stageWord} · ${advice} 先：${action}`
        : `感觉是对的${stageWord} · ${advice} 但还要：${action}`;
    }
    if (suit === 'swords') {
      return sig.reversed
        ? `账还没算清 · 别签字${stageWord}。${advice} 先：${action}`
        : `条款是清的${stageWord} · ${advice} 落地：${action}`;
    }
    return sig.reversed
      ? `底子不稳 · 别加杠杆${stageWord}。${advice} 先：${action}`
      : `物质面是稳的${stageWord} · ${advice} 具体：${action}`;
  }

  // 时机型
  if (matter === 'timing') {
    return sig.reversed
      ? `时机还没到${stageWord} · ${advice} 先：${action}`
      : `时机在${stageWord} · ${advice} 抓一下：${action}`;
  }

  // 表达 / 沟通型
  if (matter === 'speech') {
    if (suit === 'swords') {
      return sig.reversed
        ? `话说出来会伤${stageWord} · ${advice} 改成：${action}`
        : `话该清楚${stageWord} · ${advice} 具体：${action}`;
    }
    return sig.reversed
      ? `用词节奏要慢半拍${stageWord} · ${advice} 试：${action}`
      : `表达的方向是对的${stageWord} · ${advice} 落地：${action}`;
  }

  // 健康型
  if (matter === 'health') {
    return sig.reversed
      ? `身体在发出停一下的信号${stageWord} · ${advice} 今天：${action}`
      : `状态是稳的${stageWord} · ${advice} 维持：${action}`;
  }

  // 一般
  return sig.reversed
    ? `${kw2}的反向状态${stageWord} · ${advice} 先做：${action}（${polarityHint}）`
    : `落在${kw} / ${kw2}${stageWord} · ${advice} 具体：${action}`;
}

// === 追问层 · 成熟塔罗师常用回应套路 ===
// 用户在拿到第一段融合解读后再问 · 系统给出聚焦 / 落地的二次回答
// 不再 reroll · 仍用同一张牌 · 但根据追问类型走不同路径

export type FollowUpKind =
  | 'constraint'  // 但是 · 必须 · 不得不（约束式追问）
  | 'when'        // 什么时候 · 多久（时间问）
  | 'who'         // 谁 · 什么样的人（人物问）
  | 'how'         // 怎么 · 如何（步骤问）
  | 'why'         // 为什么 · 凭什么（归因问）
  | 'what'        // 什么意思 · 不懂（释义问）
  | 'general';

export interface FollowUpAnswer {
  kind: FollowUpKind;
  reading: string;   // 接住追问 · 一段更聚焦的解读
  next: string;      // 一个具体的、可执行的下一步
  caveat?: string;   // 这张牌的边界 / 做不了的事
}

const FOLLOWUP_RULES: Array<{ kind: FollowUpKind; pattern: RegExp }> = [
  { kind: 'constraint', pattern: /(但|可是|然而|不得不|必须|要求|没办法|只能|偏要|偏偏|实在|没法|硬|得|要|得是)/ },
  { kind: 'when',       pattern: /(什么时候|何时|多久|几点|多长|多快|多慢|今天|明天|这周|这月|月底|马上|立即|拖)/ },
  { kind: 'who',        pattern: /(谁|哪种人|什么样的人|对象|找谁|找哪种|什么人)/ },
  { kind: 'how',        pattern: /(怎么|如何|怎样|具体怎么|步骤|流程|做什么)/ },
  { kind: 'why',        pattern: /(为什么|为啥|凭什么|怎么会|为何)/ },
  { kind: 'what',       pattern: /(什么意思|不懂|不理解|啥意思|是说|意思是|意思|没看懂)/ }
];

export function detectFollowUpKind(q: string): FollowUpKind {
  const s = q.trim();
  for (const r of FOLLOWUP_RULES) {
    if (r.pattern.test(s)) return r.kind;
  }
  return 'general';
}

// 数字阶段 → 时间窗口（成熟塔罗师常用映射）
function timingWindow(num: number | null, reversed: boolean): string {
  if (num === null) return reversed ? '会被拖延 · 别用线性时间预期' : '时机正在生成 · 1-2 周内显化';
  if (reversed) {
    if (num <= 3) return '比预期更慢 · 不在这周';
    if (num <= 5) return '会被搅动 · 反而在解决前加剧';
    if (num <= 7) return '看似停滞 · 1-2 周内会拐弯';
    if (num <= 10) return '已过去 · 别再等 · 该收尾';
    return '人物迟到 / 错位 · 别等';
  }
  if (num === 1) return '才刚开始 · 别问"何时" · 先动一下';
  if (num <= 3) return '雏形阶段 · 这一周里能看出方向';
  if (num === 4) return '会停留一阵 · 2-4 周';
  if (num === 5) return '当下就是关口 · 24-72 小时内决断';
  if (num === 6) return '正在调和 · 3-7 天内显现答案';
  if (num === 7) return '路口期 · 1-2 周内必须选';
  if (num === 8) return '内化期 · 慢慢显化 · 2-4 周';
  if (num === 9) return '近完成 · 这一周内会自然落地';
  if (num === 10) return '已经到了 · 把闭环做完';
  return '人物近在身边 · 留意接下来 1 周';
}

// suit + court 映人物原型
const PERSON_BY_SUIT: Record<TarotSuit, string> = {
  wands:     '主动型 · 行动力强 · 有点闯 · 给你火气和推进',
  cups:      '情感丰富 · 善聆听 · 直觉好 · 给你共情和温度',
  swords:    '思辨型 · 理性 · 直言 · 给你边界和清醒',
  pentacles: '务实型 · 资源稳 · 长线思维 · 给你保障和稳定'
};
const COURT_ROLE: Record<number, string> = {
  11: '侍者级 · 学习者 / 探索者 · 年轻 / 新手 / 试水阶段',
  12: '骑士级 · 推进者 / 行动派 · 直接 / 有冲劲',
  13: '皇后级 · 内化者 / 滋养者 · 成熟 / 关怀',
  14: '国王级 · 主宰者 / 整合者 · 资深 / 有权威'
};

// suit → "怎么做"的 3 步拆解
const HOW_STEPS_BY_SUIT: Record<TarotSuit, [string, string, string]> = {
  wands:     ['1) 认领你的目标 · 用一句话说出来', '2) 当众或对一个人公开宣布', '3) 今天就推第一个动作'],
  cups:      ['1) 先连上自己的感受 · 写 3 行', '2) 把感受真实表达给对方', '3) 留出空间等回应 · 不催'],
  swords:    ['1) 把事实和情绪分开列', '2) 写下你的假设 + 它的反面', '3) 找一条证据验证 / 反驳'],
  pentacles: ['1) 列出你手上现有资源', '2) 做一个最小预算 / 时间表', '3) 下一步动手 · 不再纸上']
};

export function buildFollowUp(
  card: TarotCardData,
  isReversed: boolean,
  _originalQuestion: string,
  followUp: string
): FollowUpAnswer {
  const sig = analyzeCard(card, isReversed);
  const kind = detectFollowUpKind(followUp);
  const polarityWord = isReversed ? '逆位' : '正位';
  const cardName = `${card.name} ${polarityWord}`;

  switch (kind) {
    case 'constraint': {
      // 用户在 push back · 给"如果非做不可"的桥接式答疑
      const risk = isReversed
        ? `这张牌（${cardName}）警告的就是反向 / 内在阻塞 · 你强推会让阻塞更深`
        : `这张牌（${cardName}）的提醒不是"不要做" · 是"带着这份觉察做"`;
      return {
        kind,
        reading: `${risk}。${card.advice}`,
        next: `${card.action}（在做之前先把"${card.keywords[0]}"明确给自己看一眼）`,
        caveat: '塔罗不替你拍板 · 它只标记你忽略了什么'
      };
    }
    case 'when': {
      return {
        kind,
        reading: `时间窗口：${timingWindow(sig.number, isReversed)}。${card.advice}`,
        next: `今天先做：${card.action}（这一步本身会让时间显化）`
      };
    }
    case 'who': {
      const isCourt = sig.number !== null && sig.number >= 11;
      const personHint = sig.suit
        ? (isCourt ? `${COURT_ROLE[sig.number!]} · 在 ${PERSON_BY_SUIT[sig.suit].split(' · ')[0]} 这一域` : PERSON_BY_SUIT[sig.suit])
        : '一个能让你看清当前命题的人';
      const reversedNote = isReversed ? '· 但留意此人可能是"反向版本" · 表面像但底层不是' : '';
      return {
        kind,
        reading: `这张牌指向的人物原型：${personHint} ${reversedNote}`.trim(),
        next: `今天留意身边谁符合这个原型 · ${card.action}`
      };
    }
    case 'how': {
      if (!sig.suit) {
        // 大阿没有 suit · 给 advice + action 简化版
        return {
          kind,
          reading: `${card.advice} 大阿尔卡纳层级不需要分步骤 · 这是命题级动作`,
          next: card.action
        };
      }
      const [s1, s2, s3] = HOW_STEPS_BY_SUIT[sig.suit];
      return {
        kind,
        reading: `按 ${sig.suit === 'wands' ? '权杖' : sig.suit === 'cups' ? '圣杯' : sig.suit === 'swords' ? '宝剑' : '钱币'} 能量拆 3 步：\n${s1}\n${s2}\n${s3}`,
        next: `从第 1 步开始 · 今天就把它做掉`
      };
    }
    case 'why': {
      const why = isReversed
        ? `因为这件事的能量被"${card.keywords[0]}"反向卡住 · 不是外部不公 · 是内在还没消化`
        : `因为这是"${card.keywords[0]}"的自然演进 · 该出现的现在就在显化`;
      const stageHint = sig.stage ? `当前是「${sig.stage}」` : '';
      return {
        kind,
        reading: `${why}。${stageHint} ${card.advice}`.trim(),
        next: card.action
      };
    }
    case 'what': {
      const meaning = isReversed ? card.reversed : card.upright;
      return {
        kind,
        reading: `${cardName} = "${card.core}" 落到日常说就是：${meaning} 关键词：${card.keywords.join(' · ')}`,
        next: card.action
      };
    }
    default: {
      return {
        kind,
        reading: `回到这张牌的核心：${card.core} 你问的"${followUp.slice(0, 24)}${followUp.length > 24 ? '...' : ''}"在这张牌看来 = ${card.keywords[0]}的题`,
        next: card.action
      };
    }
  }
}
