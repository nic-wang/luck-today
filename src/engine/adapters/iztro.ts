// 紫微斗数 adapter · iztro
// 把 iztro 的 chart 数据归一成 luck-today 内部 ZiweiChart shape
//
// timeIndex 转换：iztro 用 0-11 时辰索引，不是 24h
//   23-01 子 = 0
//   01-03 丑 = 1
//   ...
//   13-15 未 = 7
//   ...
//   21-23 亥 = 11

import { astro } from 'iztro';
import type { MemberProfile } from '../../types';

export interface ZiweiPalace {
  index: number;          // 0-11
  name: string;           // 命宫 / 兄弟 / 夫妻 / ...
  heavenlyStem: string;
  earthlyBranch: string;
  isBodyPalace: boolean;
  isSoulPalace: boolean;  // 命宫
  majorStars: string[];   // 主星名（去掉 type 等）
  minorStars: string[];   // 副星名
  brightness: string[];   // 主星亮度
}

export interface ZiweiChart {
  soul: string;            // 命主（如"禄存"）
  body: string;            // 身主（如"天机"）
  fiveElementsClass: string; // "火六局" / "木三局" 等
  solarDate: string;
  lunarDate: string;
  zodiac: string;
  palaces: ZiweiPalace[];   // 长度 12 · 按 iztro 顺序（command palace at index 0?）
}

function birthHourToTimeIndex(h: number): number {
  if (h >= 23 || h < 1) return 0;  // 子时
  return Math.floor((h - 1) / 2) + 1;
}

export function computeZiweiChart(member: MemberProfile): ZiweiChart | null {
  if (member.kind !== 'human' || !member.birthDate || !member.gender) return null;
  try {
    const timeIndex = birthHourToTimeIndex(member.birthHour ?? 12);
    const gender = member.gender === '男' ? '男' : '女';
    const chart = astro.bySolar(member.birthDate, timeIndex, gender, true, 'zh-CN');
    const palaces: ZiweiPalace[] = chart.palaces.map((p, i) => ({
      index: i,
      name: p.name,
      heavenlyStem: p.heavenlyStem,
      earthlyBranch: p.earthlyBranch,
      isBodyPalace: !!p.isBodyPalace,
      // FIX: iztro 的 isOriginalPalace 是「来因宫」标记 · 不是命宫
      // 命宫 = palace.name === '命宫' · 这才是 12 宫第一宫
      isSoulPalace: p.name === '命宫',
      majorStars: (p.majorStars ?? []).map(s => s.name),
      minorStars: [
        ...(p.minorStars ?? []).map(s => s.name),
        ...(p.adjectiveStars ?? []).map(s => s.name)
      ],
      brightness: (p.majorStars ?? []).map(s => s.brightness ?? '')
    }));
    return {
      soul: chart.soul ?? '',
      body: chart.body ?? '',
      fiveElementsClass: chart.fiveElementsClass ?? '',
      solarDate: chart.solarDate ?? '',
      lunarDate: chart.lunarDate ?? '',
      zodiac: chart.zodiac ?? '',
      palaces
    };
  } catch (err) {
    console.warn('[ziwei] compute failed:', err);
    return null;
  }
}
