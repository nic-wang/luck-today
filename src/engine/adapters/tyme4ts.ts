import { ChildLimit, Gender, SolarTime } from 'tyme4ts';
import type { MemberProfile } from '../../types';

export interface DecadeFortuneInfo {
  index: number;
  startAge: number;
  endAge: number;
  startYear: number;
  endYear: number;
  ganZhi: string;
  isCurrent: boolean;
}

export interface YearFortuneInfo {
  age: number;
  year: number;
  ganZhi: string;
  isCurrent: boolean;
}

function parseBirth(member: MemberProfile): { y: number; m: number; d: number; h: number } | null {
  if (!member.birthDate) return null;
  const parts = member.birthDate.split('-').map(s => Number(s));
  if (parts.length < 3 || parts.some(n => Number.isNaN(n))) return null;
  return {
    y: parts[0],
    m: parts[1],
    d: parts[2],
    h: typeof member.birthHour === 'number' ? member.birthHour : 12
  };
}

function buildChildLimit(member: MemberProfile): ChildLimit | null {
  const birth = parseBirth(member);
  if (!birth) return null;
  if (member.kind !== 'human') return null;
  try {
    const solar = SolarTime.fromYmdHms(birth.y, birth.m, birth.d, birth.h, 0, 0);
    const gender = member.gender === '男' ? Gender.MAN : Gender.WOMAN;
    return ChildLimit.fromSolarTime(solar, gender);
  } catch {
    return null;
  }
}

function currentSolarYear(): number {
  return new Date().getFullYear();
}

export function computeDecadeFortunes(member: MemberProfile, count = 8): DecadeFortuneInfo[] {
  const cl = buildChildLimit(member);
  if (!cl) return [];
  let df = cl.getStartDecadeFortune();
  const nowYear = currentSolarYear();
  const list: DecadeFortuneInfo[] = [];
  for (let i = 0; i < count; i++) {
    const startYear = df.getStartLunarYear().getYear();
    const endYear = df.getEndLunarYear().getYear();
    list.push({
      index: i,
      startAge: df.getStartAge(),
      endAge: df.getEndAge(),
      startYear,
      endYear,
      ganZhi: df.getName(),
      isCurrent: nowYear >= startYear && nowYear <= endYear
    });
    df = df.next(1);
  }
  return list;
}

export function computeYearFortunes(member: MemberProfile, decadeIndex: number): YearFortuneInfo[] {
  const cl = buildChildLimit(member);
  if (!cl) return [];
  let df = cl.getStartDecadeFortune();
  for (let i = 0; i < decadeIndex; i++) df = df.next(1);
  let f = df.getStartFortune();
  const nowYear = currentSolarYear();
  const list: YearFortuneInfo[] = [];
  for (let i = 0; i < 10; i++) {
    const year = f.getLunarYear().getYear();
    list.push({
      age: f.getAge(),
      year,
      ganZhi: f.getName(),
      isCurrent: year === nowYear
    });
    f = f.next(1);
  }
  return list;
}

// 流月：基于当前年的农历月份遍历 12 个月（用 LunarYear → LunarMonth → SixtyCycle）
export interface MonthFortuneInfo {
  index: number;        // 1..12（农历月）
  monthChinese: string; // 正月 / 二月 ...
  ganZhi: string;
  isCurrent: boolean;
}

export function computeMonthFortunes(member: MemberProfile, solarYear: number): MonthFortuneInfo[] {
  const cl = buildChildLimit(member);
  if (!cl) return [];
  // 用 SolarTime → SixtyCycleMonth 拿月柱干支
  const list: MonthFortuneInfo[] = [];
  const now = new Date();
  const nowYear = now.getFullYear();
  const nowMonth = now.getMonth() + 1;
  for (let m = 1; m <= 12; m++) {
    try {
      // 用每月 15 号取节气月柱（避开月头节气切换的边界）
      const solar = SolarTime.fromYmdHms(solarYear, m, 15, 12, 0, 0);
      const cycleMonth = solar.getSixtyCycleHour().getSixtyCycleDay().getSixtyCycleMonth();
      list.push({
        index: m,
        monthChinese: `${m}月`,
        ganZhi: cycleMonth.getName(),
        isCurrent: solarYear === nowYear && m === nowMonth
      });
    } catch {
      // skip
    }
  }
  return list;
}
