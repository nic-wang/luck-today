import { beforeAll, describe, expect, it } from 'vitest';
import { members } from '../data/members';
import { relations } from '../data/relations';
import { computeDailyLuck, computeRelationToday } from './luckEngine';

beforeAll(() => {
  globalThis.Solar = {
    fromYmdHms: () => ({
      getLunar: () => ({
        getEightChar: () => ({
          getYearGan: () => '丙',
          getYearZhi: () => '午',
          getMonthGan: () => '癸',
          getMonthZhi: () => '巳',
          getDayGan: () => '乙',
          getDayZhi: () => '亥',
          getTimeGan: () => '癸',
          getTimeZhi: () => '未'
        }),
        getYearGan: () => '丙',
        getYearZhi: () => '午',
        getMonthGan: () => '癸',
        getMonthZhi: () => '巳',
        getDayGan: () => '己',
        getDayZhi: () => '亥',
        getTimeGan: () => '甲',
        getTimeZhi: () => '子',
        getYearInGanZhi: () => '丙午',
        getMonthInChinese: () => '四',
        getDayInChinese: () => '初九'
      })
    })
  };
});

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

declare global {
  var Solar: {
    fromYmdHms: (...args: number[]) => {
      getLunar: () => {
        getEightChar: () => Record<string, () => string>;
        getYearGan: () => string;
        getYearZhi: () => string;
        getMonthGan: () => string;
        getMonthZhi: () => string;
        getDayGan: () => string;
        getDayZhi: () => string;
        getTimeGan: () => string;
        getTimeZhi: () => string;
        getYearInGanZhi: () => string;
        getMonthInChinese: () => string;
        getDayInChinese: () => string;
      };
    };
  };
}
