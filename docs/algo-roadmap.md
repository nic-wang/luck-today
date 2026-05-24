# Algo Roadmap · luck-today v3 引擎升级建议

> 给 codex 的算法补位 spec · 基于 v2 build (`assets/index-BMkmTXyb.js`) 当前状态校准
> 维护者：cc（Claude Code 工程视角）· 2026-05-24
>
> **优先级口径**：P0 = 零成本零依赖立刻补；P1 = 引入 1 个新库立刻提升；P2 = 中长期视角扩展
>
> 不是要全部做完，是给一份「随时可拉的补位清单」，codex 跑到哪一步都可对照。

---

## Context · 当前 v2 状态校准

**已达成** ✅：
- v2 schema 落地（`trustLevel: deterministic | interpretive` 已在 bundle）
- frosted glass `backdrop-filter:blur(22px)` 加上
- 7 卡片今日全景（避坑 / 贵人 / 居家 / 作息 / 说话 / 挑战 / 塔罗）
- 关系详情 narrative 化（"嘻嘻丙火与泡泡辛金天干合化为水"）
- trustLevel 在 UI 已外显（"塔罗只做仪式感不进入核心分数"）

**仍未达成** ⚠️：
1. `prefers-color-scheme` 媒体查询缺失 → 暗色变量预设但未自适应
2. `factors[]` 因子追溯未在 UI 暴露 → v2 schema 核心卖点没让用户看到
3. 时间维度只有「今日」→ 大运 / 流年 / 流月缺失（产品长程视角）
4. 八门是简化版（开/休/生/伤/杜/景/死/惊 + 12 时辰）→ 不是正统九宫八门
5. tarot 数据是简化 38 张 → 非正统 RWS 78 张

---

## P0 · 零成本零依赖 gap（不引新库）

### G1. factors[] 因子追溯 UI

**现状**：v2 schema 已有 `Factor[]` 类型 · 算法层在 compute 时已生成 · UI 没渲染。

**spec**：

每个 `DailyLuckResult` 卡片底部加一个折叠面板「为什么这么算」，展开后渲染 `result.factors[]`：

```tsx
// src/features/explain/FactorList.tsx
interface FactorListProps {
  factors: Factor[];
  trustLevel: 'deterministic' | 'interpretive' | 'entertainment';
}

export function FactorList({ factors, trustLevel }: FactorListProps) {
  const trustLabel = {
    deterministic: '确定层 · 农历八字算法',
    interpretive: '解释层 · 流派推断',
    entertainment: '仪式层 · 心态提示',
  }[trustLevel];

  return (
    <details className="factor-panel">
      <summary>为什么这么算 · {trustLabel}</summary>
      <ol className="factor-list">
        {factors.map((f, i) => (
          <li key={i}>
            <span className="factor-type">{f.type}</span>
            <span className="factor-detail">{f.detail}</span>
            <span className="factor-weight" title={`权重 ${f.weight}`}>
              {'·'.repeat(Math.round(f.weight * 5))}
            </span>
          </li>
        ))}
      </ol>
    </details>
  );
}
```

**视觉**：折叠 / 展开用 native `<details>`（无 JS 状态）· factor-weight 用点数视觉化（5 个点 = 满权重）。

### G2. prefers-color-scheme 暗色自适应

**现状**：bundle 里已有暗色变量（`#17211b` `#1e3026` `#1f2e24`）但无媒体查询接入。

**spec**：

```css
/* src/shared/styles/tokens.css */
:root {
  --bg: #f6f7f4;
  --ink: #213026;
  --ink-soft: #4d5d51;
  --line: #e0e8dd;
  --card: #ffffff;
  --frosted: rgba(255, 255, 255, 0.6);
}

@media (prefers-color-scheme: dark) {
  :root {
    --bg: #17211b;
    --ink: #e0e8dd;
    --ink-soft: #8a938c;
    --line: #344238;
    --card: #1e3026;
    --frosted: rgba(30, 48, 38, 0.6);
  }
}

/* 手动切换覆盖 */
:root[data-theme="light"] { color-scheme: light; }
:root[data-theme="dark"] { color-scheme: dark; }
```

`useTheme()` hook 读 `data-theme` attribute · 默认 `auto`（跟随系统）。

---

## P1 · 立刻可拉的 3 个库

### L1. tyme4ts · 大运 / 流年 / 流月（最高 ROI）

**问题**：当前时间维度只有「今日」· "大运" 是 stub · 没有流年 / 流月。

**库**：[6tail/tyme4ts](https://github.com/6tail/tyme4ts)（lunar-javascript 同作者升级版）
- npm: `tyme4ts`
- TypeScript 原生
- Stars: 443 · 活跃维护
- 自述「lunar 升级版，更优设计和扩展性」

**集成（adapter 模式 · 不直接耦合到 features）**：

```typescript
// src/engine/fortune.ts
import { SolarTime, EightChar, Gender } from 'tyme4ts';

export interface DecadeFortune {
  startAge: number;
  startYear: number;
  ganZhi: string;
  shiShen: string;
  factors: Factor[];
}

export function computeDecadeFortune(member: MemberProfile): DecadeFortune[] {
  const solar = SolarTime.fromYmdHms(...);
  const lunar = solar.getLunarHour();
  const bazi = lunar.getEightChar();
  const gender = member.gender === '男' ? Gender.MAN : Gender.WOMAN;

  const decades = bazi.getDecadeFortune(gender, solar);
  return decades.slice(0, 8).map(d => ({
    startAge: d.getStartAge(),
    startYear: d.getStartSolarYear(),
    ganZhi: d.getName(),
    shiShen: getShiShenName(bazi.getDay().getHeavenStem(), d.getHeavenStem()),
    factors: [
      { type: 'fortune', weight: 1.0, source: `decade.${d.getName()}`, detail: `大运 ${d.getName()} 起 ${d.getStartAge()} 岁` }
    ],
  }));
}

export function computeYearFortune(member: MemberProfile, year: number): YearFortune {
  // tyme4ts: bazi.getFortune(gender, year) 拿流年
}

export function computeMonthFortune(member: MemberProfile, year: number, month: number): MonthFortune {
  // 流月
}
```

**新路由 / 视图**：
- `/fortune/<who>` → 大运时间轴（人生 8 步大运）
- `/fortune/<who>/<year>` → 流年盘（12 个月流月）

**风险**：
- tyme4ts 与 lunar-javascript API 不完全兼容 · 不要直接替换 · 用 adapter 隔离 · 保留 lunar.js 作 fallback
- 包体积约 +50KB · 在可接受范围

### L2. RWS 78 张 tarot 数据替换

**问题**：当前 38 张是简化（无大阿尔卡纳 / 小阿尔卡纳完整体系）。

**库**：[ekelen/tarot-api](https://github.com/ekelen/tarot-api)（实际取数据 JSON 即可，不用 API）
- 78 张完整 RWS（Major Arcana 22 + Minor Arcana 56）
- JSON 格式：name / arcana / suit / number / keywords / meaning_up / meaning_rev / image
- Stars: 383

**集成**：

```typescript
// src/data/tarot.ts
import tarotData from './rws-78.json';

export interface TarotCard {
  name: string;
  nameZh: string;       // 需要补中文翻译（GitHub 上有中文版）
  arcana: 'major' | 'minor';
  suit?: 'wands' | 'cups' | 'swords' | 'pentacles';
  number?: number;
  keywords: string[];
  meaningUpright: string;
  meaningReversed: string;
  // luck-today 自定义字段
  miniNarrative?: string;  // 给嘻嘻 / 牛牛的定制叙述
}

// src/engine/tarot.ts
export function drawDailyTarot(seed: string): TarotCard {
  // 用 (member.id + date.toISOString().slice(0,10)) 做 deterministic seed
  const idx = hashString(seed) % tarotCards.length;
  return tarotCards[idx];
}
```

**视觉**：当前 v2 已经有 `tarot-result` / `tarot-keywords` / `tarot-no` 等 className，数据替换不影响 UI。

**风险**：中文翻译需校对（GitHub 上有几份中文 RWS 翻译，质量不一）。

### L3. taobi · 奇门遁甲九宫（升级简化版 8 门）

**问题**：当前 8 门是「12 时辰映射 8 门名」简化版 · 不是正统「九宫八门 + 三奇六仪 + 时家奇门」。

**库**：[Taogram/taobi](https://github.com/Taogram/taobi)
- 纯 JS · 节气走 VSOP87D 天文算法
- Stars: 51 · 学术度高
- 输出：九宫盘 + 天盘地盘 + 值符值使

**集成**：

```typescript
// src/engine/qimen.ts
import { Qimen } from 'taobi';

export interface QimenChart {
  jiu_gong: NinePalace[];   // 九宫格 · 每宫含天干地支星门神
  tian_pan: string[];        // 天盘
  di_pan: string[];          // 地盘
  zhi_fu: string;            // 值符
  zhi_shi: string;           // 值使
  ji_shi: string;            // 吉时
}

export function computeQimen(date: Date): QimenChart {
  const qm = new Qimen(date);
  return {
    jiu_gong: qm.getNinePalaces(),
    tian_pan: qm.getTianPan(),
    di_pan: qm.getDiPan(),
    zhi_fu: qm.getZhiFu(),
    zhi_shi: qm.getZhiShi(),
    ji_shi: qm.getJiShi(),
  };
}
```

**新视图**：`/today/<who>` 详情页加一个「流日方位盘」九宫卡片（替代当前简化时辰盘）。

**风险**：奇门数据信息密度高 · 移动端要做"展开 / 折叠"否则单屏装不下 · trustLevel 设为 `interpretive`。

---

## P2 · 中长期扩展（不阻塞 P1）

### L4. iztro · 紫微斗数副视角

**库**：[SylarLong/iztro](https://github.com/SylarLong/iztro) · Stars 3,727 · TS · 3 天前刚 push（事实标准）

**用法**：作为「八字 + 紫微」双视角对照 · 不替代核心 · 加一个 `/zwds/<who>` 路由。

**集成**：

```typescript
import { astro } from 'iztro';
const chart = astro.bySolar('1989-05-15', 14, '男');
// chart.palaces = 12 宫 · chart.stars = 主星 / 辅星
```

**何时引入**：八字 + 奇门两条线稳定后 · 用紫微做"我命盘是什么样"的解读补充。

### L5. lunisolar 插件层（神煞 / 28 宿 / 建除十二神）

**库**：[waterbeside/lunisolar](https://github.com/waterbeside/lunisolar) + 官方 plugins
- Stars: 393
- 插件化：`lunisolar/plugins/shensha` / `lunisolar/plugins/n8s` 等

**用法**：tyme4ts 出八字四柱 · lunisolar plugins 补建除十二神 / 28 星宿 / 神煞这种细粒度数据。

**何时引入**：v2 schema 的 `factors[]` 想做更细粒度因子时（比如"今日为破日 + 危宿值日"作为 factor）。

---

## v3 schema 演进规划

```typescript
// src/engine/types.ts (v3)

export interface DailyLuckResult {
  // 既有（v2 已落）
  date: string;
  member: string;
  score: number;
  label: string;
  shishen: { name: string; theme: string };
  pillars: { year: string; month: string; day: string; hour: string };
  gates: GateInfo[];
  advice: { goodFor: string[]; watchOut: string[]; scene: string };
  explanation: string;
  factors: Factor[];
  tarot: { card: string; meaning: string };
  trustLevel: 'deterministic' | 'interpretive' | 'entertainment';

  // v3 新增（P1 库引入后）
  decadeFortune?: DecadeFortune;     // 当前所在大运
  yearFortune?: YearFortune;          // 流年
  monthFortune?: MonthFortune;        // 流月
  qimen?: QimenChart;                 // 奇门九宫盘
  tarotCard?: TarotCard;              // RWS 78 张

  // v4 候选（P2 库）
  ziwei?: ZiweiChart;                 // 紫微斗数
  shensha?: Shensha[];                // 神煞
}
```

**Factor type 扩展**：

```typescript
type FactorType =
  | 'shishen' | 'wuxing' | 'gate' | 'relation'    // v2
  | 'fortune' | 'qimen' | 'tarot'                  // v3 新增
  | 'shensha' | 'ziwei';                           // v4
```

---

## 测试清单（每次新库接入后）

- 算法快照：`pnpm test src/engine/__tests__/` 全绿（3 日期 × 2 人物 fixture diff 为空）
- 体积控制：`pnpm build` 后 `dist/assets/index-*.js` 增长 ≤ 100KB / 库
- 类型严格：`pnpm tsc --noEmit` strict mode 无 error
- 移动端：iPhone Safari 实测新视图 · 信息密度不爆
- trustLevel：每个新模块明确归到 `deterministic` / `interpretive` / `entertainment`

---

## 集成顺序建议（最小风险 / 最大产出）

```
Step 1: G1 (factors UI) + G2 (暗色)  — 零成本, 30min
Step 2: L1 tyme4ts (大运 / 流年 / 流月)  — 最高 ROI, 1 day
Step 3: L2 RWS 78 张 (数据替换)         — 视觉无变化, 2h
Step 4: L3 taobi 奇门九宫               — 新增视图, 1 day
[evaluate]  ← 此时 v3 已成熟, 评估 P2
Step 5: L4 iztro 紫微 (副视角)         — 选做
Step 6: L5 lunisolar plugins (神煞)    — 选做
```

---

## adapter 模式约定

所有新库都包装到 `src/engine/adapters/<lib>.ts` · 不直接 import 到 features 层：

```
src/engine/
├─ adapters/
│   ├─ tyme4ts.ts       ← tyme4ts API → luck-today 内部类型
│   ├─ taobi.ts          ← taobi → QimenChart
│   ├─ iztro.ts          ← iztro → ZiweiChart
│   └─ lunisolar.ts      ← lunisolar plugins → Factor[]
├─ daily.ts              ← 调 adapters 不调原库
└─ types.ts              ← 内部类型定义
```

**好处**：将来某个库换掉 / 升级 / fork · 只动 adapter · features 层无感知。

---

## 风险与回退

| 风险 | 对策 |
|------|------|
| 新库 bug 导致算法漂移 | 快照测试强制对齐 · CI 必须全绿才合 |
| 包体积失控 | 每个 P1 库后 `pnpm build` 看 bundle size · 单库 +100KB 内可接受 |
| 中文翻译缺失（RWS / 紫微星名） | 写中文映射表放 `src/data/i18n/` · 维护者自决 |
| codex 跑得不在 main 而在 feat 分支 | 本 spec 不强制 push · codex 需要时 pull 即可 |

---

## 维护

- 本文件位置：`docs/algo-roadmap.md`（仓库内 · 跟代码同 PR）
- 每次接入新库后回头更新「集成顺序建议」勾选状态
- v3 schema 演进每次锁定后回头更新「v3 schema 演进规划」
