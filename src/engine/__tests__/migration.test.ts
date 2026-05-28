// 引擎迁移快照测试 · S1: lunar.js → tyme4ts
// 基线 fixture (lunar-baseline.snap.json) 由旧 lunar.js UMD 在 2026-05-28 生成
// 所有 8 个干支字段必须 1:1 一致；monthInChinese 经 adapter strip "月" 后必须一致

import { describe, expect, it } from 'vitest';
import baseline from './lunar-baseline.snap.json';
import { buildBazi, buildToday } from '../adapters/tyme4ts-bazi';

interface BaziKey {
  key: string;
  args: [number, number, number, number];
}
interface TodayKey {
  key: string;
  date: Date;
}

const baziCases: BaziKey[] = [
  { key: 'niu-1989-05-15-14', args: [1989, 5, 15, 14] },
  { key: 'xixi-1999-06-03-22', args: [1999, 6, 3, 22] }
];

const todayCases: TodayKey[] = [
  { key: '2026-05-28-12:00:00', date: new Date(2026, 4, 28, 12, 0, 0) },
  { key: '2026-05-28-00:00:00', date: new Date(2026, 4, 28, 0, 0, 0) },
  { key: '2026-05-06-12:00:00', date: new Date(2026, 4, 6, 12, 0, 0) },
  { key: '1989-05-15-14:00:00', date: new Date(1989, 4, 15, 14, 0, 0) }
];

describe('S1 · lunar.js → tyme4ts engine migration', () => {
  describe('buildBazi', () => {
    for (const tc of baziCases) {
      it(`matches lunar.js baseline for ${tc.key}`, () => {
        const result = buildBazi(...tc.args);
        const expected = baseline.bazi[tc.key as keyof typeof baseline.bazi];
        expect(result).toEqual(expected);
      });
    }
  });

  describe('buildToday', () => {
    for (const tc of todayCases) {
      it(`matches lunar.js baseline for ${tc.key}`, () => {
        const result = buildToday(tc.date);
        const expected = baseline.today[tc.key as keyof typeof baseline.today];
        expect(result).toEqual(expected);
      });
    }
  });
});
