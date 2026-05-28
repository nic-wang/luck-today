// 叙事文本生成 · 把 DailyLuckResult 的 raw 数据合成"1 句结论 + N 条支撑"
// 信息密度：中等口径 · 结论一句话 · 支撑保留具体数据

import type { DailyLuckResult, MemberProfile } from '../types';

const SHISHEN_TONE: Record<string, string> = {
  比肩: '与人协作的一天 · 找同频伙伴推进',
  劫财: '小心利益分歧 · 别一个人扛',
  食神: '创造和表达的一天 · 把想法做出来',
  伤官: '才华外露 · 但话别说太满',
  偏财: '抓短期机会 · 财气与人脉同时来',
  正财: '稳扎稳打的一天 · 把活做实',
  七杀: '硬仗与挑战 · 顶住压力',
  正官: '走规矩 · 适合做公开承诺与流程',
  偏印: '独立思考 · 选偏冷门视角',
  正印: '学习吸收的一天 · 接受指导'
};

// 个人时辰标签 → 当下行动建议（per-person · 让两人结论不一样）
const PERSONAL_TAG_TONE: Record<string, { do: string; donot: string }> = {
  同气: { do: '当下助身 · 适合主动出招', donot: '别拖到更晚' },
  生身: { do: '当下被支撑 · 抓机会推进', donot: '别只顾接收不行动' },
  泄身: { do: '能量在外散 · 适合输出表达', donot: '别硬扛新任务' },
  克身: { do: '当下受压 · 守住核心 · 别开新战线', donot: '不打硬仗' },
  胜出: { do: '主动出击占上风 · 适合谈判推进', donot: '别得理不饶人' },
  中性: { do: '正常推进', donot: '保持节奏' }
};

export function themeNarrative(item: DailyLuckResult): { conclusion: string; tagline: string } {
  const tone = SHISHEN_TONE[item.theme.shiShen] ?? item.theme.title;
  return {
    conclusion: tone,
    tagline: `${item.theme.shiShen} · ${item.theme.title}`
  };
}

export interface NarrativeRow {
  icon: string;
  label: string;
  detail: string;
}

export function supportNarrative(item: DailyLuckResult): {
  conclusion: string;
  rows: NarrativeRow[];
} {
  const rec = item.recommendations;
  const direction = rec.helper.find(r => r.label === '贵人方向')?.value ?? rec.helper[0]?.value ?? '';
  const helperVibe = rec.helper.find(r => r.label === '贵人气质')?.value ?? '';
  const homeYi = rec.home.find(r => r.label === '宜')?.value ?? rec.home[0]?.value ?? '';
  const wellnessKey = rec.wellness.find(r => r.label === '睡眠')?.value ?? rec.wellness[0]?.value ?? '';
  return {
    conclusion: '靠近对的人 · 用对的方向 · 调对的节奏',
    rows: [
      { icon: '👥', label: helperVibe ? `${direction}方位 · 找${helperVibe}` : direction, detail: '今天能借的"人气"' },
      { icon: '🏠', label: homeYi, detail: '空间做减法 · 让用神气场上位' },
      { icon: '🌙', label: wellnessKey, detail: '身体不顶 · 决策也不会准' }
    ]
  };
}

export function avoidNarrative(item: DailyLuckResult, member: MemberProfile): {
  conclusion: string;
  rows: NarrativeRow[];
} {
  const rec = item.recommendations;
  const avoid = rec.avoidList[0] ?? '';
  const speechWork = rec.speech.find(r => r.label === '工作')?.value ?? rec.speech[0]?.value ?? '';
  const challenge = member.challenges?.[item.score % (member.challenges.length || 1)];
  const rows: NarrativeRow[] = [
    { icon: '🚫', label: avoid, detail: '今天最该躲的一个动作' },
    { icon: '🗣', label: speechWork, detail: '说话节奏 · 把分寸感拉回来' }
  ];
  if (challenge) {
    rows.push({ icon: '⚠️', label: `[${challenge.tag}] ${challenge.text}`, detail: '今天的小考题' });
  }
  return {
    conclusion: '少做这些 · 多想一步',
    rows
  };
}

export function nowNarrative(item: DailyLuckResult): { conclusion: string; sub: string; donot: string } {
  const w = item.currentWindow;
  const tag = PERSONAL_TAG_TONE[w.personalTag] ?? PERSONAL_TAG_TONE.中性;
  const tagPhrase = w.personalTag === '中性' ? '' : ` · ${w.personalTag}`;
  // 把通用 advice + 个人 personalTag tone 拼成 per-person 结论
  return {
    conclusion: `${tag.do} · ${w.advice}`,
    sub: `${w.range} · ${w.zhi}时 · ${w.gate}${tagPhrase}`,
    donot: tag.donot
  };
}

