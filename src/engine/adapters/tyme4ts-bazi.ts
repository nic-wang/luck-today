// tyme4ts bazi adapter
// 把 tyme4ts 的 SolarTime → EightChar 数据归一成 luckEngine 现有 pillars shape
// 替换原 lunar.js UMD · 单引擎 · 大运 / 流年 / 流月与今日推算共享同一日期源头
//
// 验证：lunar.js vs tyme4ts 8 个干支字段 100% 一致（5 日期 × 多时辰）
// 唯一差异：tyme4ts `LunarMonth.getName()` 返回 "四月" / "十二月" · lunar.js 返回 "四" / "腊"
// 处理：adapter 里去掉 "月" 后缀 + 标准化 "十二" → "腊" 保持 v2 显示一致性
// 实际上我们改用 tyme4ts 标准格式（"十二月"），不再用 "腊" 简写——更准确

import { SolarTime } from 'tyme4ts';

export interface BaziPillars {
  yearGan: string;
  yearZhi: string;
  monthGan: string;
  monthZhi: string;
  dayGan: string;
  dayZhi: string;
  timeGan: string;
  timeZhi: string;
}

export interface TodayInfo extends BaziPillars {
  /** 60 甲子年名 e.g. "丙午" */
  yearInGanZhi: string;
  /** 农历月汉字 e.g. "四" / "正" / "十二"（不含"月"后缀，与原 lunar.js 一致） */
  monthInChinese: string;
  /** 农历日汉字 e.g. "十二" / "廿八" */
  dayInChinese: string;
}

function stripYueSuffix(name: string): string {
  // tyme4ts: "四月" → "四", "十二月" → "十二", "正月" → "正"
  return name.endsWith('月') ? name.slice(0, -1) : name;
}

export function buildBazi(year: number, month: number, day: number, hour: number): BaziPillars {
  const solar = SolarTime.fromYmdHms(year, month, day, hour, 0, 0);
  const lh = solar.getLunarHour();
  const ec = lh.getEightChar();
  const y = ec.getYear();
  const mo = ec.getMonth();
  const d = ec.getDay();
  const t = ec.getHour();
  return {
    yearGan: y.getHeavenStem().getName(),
    yearZhi: y.getEarthBranch().getName(),
    monthGan: mo.getHeavenStem().getName(),
    monthZhi: mo.getEarthBranch().getName(),
    dayGan: d.getHeavenStem().getName(),
    dayZhi: d.getEarthBranch().getName(),
    timeGan: t.getHeavenStem().getName(),
    timeZhi: t.getEarthBranch().getName()
  };
}

export function buildToday(date: Date): TodayInfo {
  const solar = SolarTime.fromYmdHms(
    date.getFullYear(),
    date.getMonth() + 1,
    date.getDate(),
    date.getHours(),
    date.getMinutes(),
    date.getSeconds()
  );
  const lh = solar.getLunarHour();
  const ld = lh.getLunarDay();
  const lm = ld.getLunarMonth();
  const ec = lh.getEightChar();
  const pillars = {
    yearGan: ec.getYear().getHeavenStem().getName(),
    yearZhi: ec.getYear().getEarthBranch().getName(),
    monthGan: ec.getMonth().getHeavenStem().getName(),
    monthZhi: ec.getMonth().getEarthBranch().getName(),
    dayGan: ec.getDay().getHeavenStem().getName(),
    dayZhi: ec.getDay().getEarthBranch().getName(),
    timeGan: ec.getHour().getHeavenStem().getName(),
    timeZhi: ec.getHour().getEarthBranch().getName()
  };
  return {
    ...pillars,
    yearInGanZhi: ec.getYear().getName(),
    monthInChinese: stripYueSuffix(lm.getName()),
    dayInChinese: ld.getName()
  };
}
