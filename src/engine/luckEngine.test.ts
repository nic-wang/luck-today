import { describe, expect, it } from 'vitest';
import { members } from '../data/members';
import { relations } from '../data/relations';
import { computeDailyLuck, computeRelationToday } from './luckEngine';

// 引擎用 tyme4ts 真实算（不再 mock lunar.js Solar）
// migration.test.ts 已经验证 tyme4ts 与 lunar.js 输出 100% 一致

describe('luck engine v2', () => {
  it('returns stable explainable daily luck', () => {
    const result = computeDailyLuck(members[0], new Date('2026-05-25T08:30:00+08:00'));

    expect(result.algorithmVersion).toBe('v2.0-explainable');
    expect(result.memberId).toBe('niu');
    expect(result.score).toBeGreaterThan(0);
    expect(result.factors.length).toBeGreaterThanOrEqual(5);
    expect(result.factors.every(factor => factor.explanation.length > 0)).toBe(true);
    expect(result.currentWindow.factorIds).toContain('hour-gate');
  });

  it('returns relation score with trace factors', () => {
    const result = computeRelationToday(relations[0], new Date('2026-05-25T08:30:00+08:00'));

    expect(result.relationId).toBe('niu_xixi');
    expect(result.score).toBeGreaterThan(0);
    expect(result.factors.length).toBe(2);
  });
});
