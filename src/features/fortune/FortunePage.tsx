import { useEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import {
  computeDecadeFortunes,
  computeMonthFortunes,
  computeYearFortunes,
  type DecadeFortuneInfo,
  type MonthFortuneInfo,
  type YearFortuneInfo
} from '../../engine/adapters/tyme4ts';
import {
  computeDecadeTheme,
  computeMonthTheme,
  computeYearTheme,
  type FortuneTheme
} from '../../engine/fortune-theme';
import type { MemberProfile } from '../../types';

interface Props {
  members: MemberProfile[];
  primaryIds: string[];
  focusId: string;
  onFocusChange: (id: string) => void;
}

export function FortunePage({ members, primaryIds, focusId, onFocusChange }: Props) {
  const whoId = focusId;
  const setWhoId = onFocusChange;
  const member = members.find(m => m.id === whoId)!;
  const decades = useMemo(() => computeDecadeFortunes(member, 8), [member]);
  const currentDecadeIdx = useMemo(() => {
    const index = decades.findIndex(d => d.isCurrent);
    return index >= 0 ? index : 0;
  }, [decades]);
  const [pickedDecade, setPickedDecade] = useState<number | null>(null);
  const focusDecadeIdx = pickedDecade ?? currentDecadeIdx;
  const focusDecade = decades[focusDecadeIdx];

  const years = useMemo(() => computeYearFortunes(member, focusDecadeIdx), [member, focusDecadeIdx]);
  const currentYearIdx = useMemo(() => {
    const index = years.findIndex(y => y.isCurrent);
    return index >= 0 ? index : 0;
  }, [years]);
  const [pickedYear, setPickedYear] = useState<number | null>(null);
  const focusYearIdx = pickedYear ?? currentYearIdx;
  const focusYear = years[focusYearIdx];

  const currentSolarYear = new Date().getFullYear();
  const months = useMemo(() => computeMonthFortunes(member, currentSolarYear), [member, currentSolarYear]);
  const currentMonthIdx = useMemo(() => {
    const index = months.findIndex(m => m.isCurrent);
    return index >= 0 ? index : new Date().getMonth();
  }, [months]);
  const [pickedMonth, setPickedMonth] = useState<number | null>(null);
  const focusMonthIdx = pickedMonth ?? currentMonthIdx;
  const focusMonth = months[focusMonthIdx];

  const decadeTheme = useMemo(() => computeDecadeTheme(member, focusDecade?.ganZhi ?? ''), [member, focusDecade?.ganZhi]);
  const yearTheme = useMemo(() => computeYearTheme(member, focusYear?.ganZhi ?? '', focusYear?.year ?? 0), [member, focusYear?.ganZhi, focusYear?.year]);
  const monthTheme = useMemo(() => computeMonthTheme(member, focusMonth?.ganZhi ?? '', focusMonth?.index ?? 0), [member, focusMonth?.ganZhi, focusMonth?.index]);

  // refs · shortcut buttons 滚动到对应段
  const decadeRef = useRef<HTMLDivElement>(null);
  const yearRef = useRef<HTMLDivElement>(null);
  const monthRef = useRef<HTMLDivElement>(null);

  // 浮动返回顶部 FAB · 滚过 240px 后显示
  const [showBackToTop, setShowBackToTop] = useState(false);
  useEffect(() => {
    function onScroll() {
      setShowBackToTop(window.scrollY > 240);
    }
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  function scrollTo(target: 'decade' | 'year' | 'month') {
    const el = target === 'decade' ? decadeRef.current
             : target === 'year'   ? yearRef.current
             : monthRef.current;
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  function resetToNow() {
    setPickedDecade(null);
    setPickedYear(null);
    setPickedMonth(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  if (!decades.length) {
    return (
      <main className="page fortune-page">
        <section className="fortune-empty panel">
          <h2>{member.name} · 大运 / 流年 / 流月</h2>
          <p className="muted">暂无完整出生信息（需要年月日 + 性别），无法推算大运。</p>
        </section>
      </main>
    );
  }

  const periodTone = helpToPolarity(yearTheme.bodyHelp);

  return (
    <main className="page fortune-page" style={{ '--accent': member.color } as CSSProperties}>
      <section className="family-overview-shell fortune-overview-shell">
        <header className="family-overview-head">
          <p className="eyebrow">FORTUNE · {member.name} · 大运驾驶舱</p>
          <h2>Hi, {member.name}</h2>
          <p className="muted small">{focusYear.year} · {focusYear.ganZhi} · {yearTheme.shishen} · {focusYear.age} 岁</p>
        </header>

        {primaryIds.length > 1 && (
          <div className="brief-actions">
            {primaryIds.map(id => {
              const target = members.find(x => x.id === id)!;
              return (
                <button
                  key={id}
                  type="button"
                  className={whoId === id ? 'active' : ''}
                  onClick={() => {
                    setWhoId(id);
                    setPickedDecade(null);
                    setPickedYear(null);
                    setPickedMonth(null);
                  }}
                >
                  {target.name}
                </button>
              );
            })}
          </div>
        )}

        {/* 当前主窗口 · 复用 family-feature-card */}
        <article className={`family-feature-card polarity-${periodTone}`}>
          <div className="ff-eyebrow">
            <span>CURRENT · 主窗口</span>
            <b>{yearTheme.helpLabel}</b>
          </div>
          <p className="ff-headline">
            <strong>{focusYear.year} · {focusYear.ganZhi}</strong>
          </p>
          <div className="ff-pair-meta">
            <span className="ff-meta-chip">{yearTheme.themeWord}</span>
            <span className="ff-meta-chip">{focusYear.age} 岁</span>
            <span className="ff-meta-chip">{focusMonth.monthChinese}</span>
            <span className="ff-meta-chip">{yearTheme.shishen}</span>
          </div>
          <div className={`energy-spectrum tone-${periodTone}`}>
            <div className="es-bar">
              <span className="es-fill" style={{ width: `${helpToPct(yearTheme.bodyHelp)}%` }} />
            </div>
            <span className="es-num">{helpToPct(yearTheme.bodyHelp)}%</span>
          </div>
        </article>

        <div className="fortune-shortcuts" role="toolbar" aria-label="fortune actions">
          <button type="button" onClick={() => scrollTo('decade')}>大运</button>
          <button type="button" onClick={() => scrollTo('year')}>流年</button>
          <button type="button" onClick={() => scrollTo('month')}>流月</button>
        </div>
      </section>

      {/* 3 brief KPI 卡 · 当前大运 / 流年 / 流月 · 复用 family-kpi-card */}
      <section className="family-kpi-grid kpi-grid-3">
        <FortuneKPICard
          label="当前大运"
          main={`第 ${focusDecade.index + 1} 步 · ${focusDecade.ganZhi}`}
          sub={`${focusDecade.startAge}-${focusDecade.endAge} 岁`}
          helpLabel={decadeTheme.helpLabel}
          tone={helpToPolarity(decadeTheme.bodyHelp)}
          pct={helpToPct(decadeTheme.bodyHelp)}
        />
        <FortuneKPICard
          label="当前流年"
          main={`${focusYear.year} · ${focusYear.ganZhi}`}
          sub={`${focusYear.age} 岁`}
          helpLabel={yearTheme.helpLabel}
          tone={helpToPolarity(yearTheme.bodyHelp)}
          pct={helpToPct(yearTheme.bodyHelp)}
        />
        <FortuneKPICard
          label="当前流月"
          main={`${focusMonth.monthChinese} · ${focusMonth.ganZhi}`}
          sub={monthTheme.shishen}
          helpLabel={monthTheme.helpLabel}
          tone={helpToPolarity(monthTheme.bodyHelp)}
          pct={helpToPct(monthTheme.bodyHelp)}
        />
      </section>

      <div ref={decadeRef} className="fortune-section">
        <SectionHeader title="大运" caption="十年一柱 · 选一步看主题" tone="now" />
        <FortuneFeatureCard
          kind="decade"
          title={`第 ${focusDecade.index + 1} 步大运 · ${focusDecade.ganZhi}`}
          sub={`${focusDecade.startAge}-${focusDecade.endAge} 岁 · ${focusDecade.startYear}-${focusDecade.endYear}`}
          isCurrent={focusDecade.isCurrent}
          theme={decadeTheme}
        />
        <div className="fortune-rail">
          {decades.map(item => (
            <DecadeChip
              key={item.index}
              info={item}
              picked={item.index === focusDecadeIdx}
              onPick={() => setPickedDecade(item.index)}
            />
          ))}
        </div>
      </div>

      <div ref={yearRef} className="fortune-section">
        <SectionHeader title="流年" caption={`所选大运的 10 个流年 · 当前 ${focusYear.year}`} tone="today" />
        <FortuneFeatureCard
          kind="year"
          title={`${focusYear.year} 年 · ${focusYear.ganZhi}`}
          sub={`${focusYear.age} 岁`}
          isCurrent={focusYear.isCurrent}
          theme={yearTheme}
        />
        <div className="fortune-rail year-rail">
          {years.map((item, index) => {
            const theme = computeYearTheme(member, item.ganZhi, item.year);
            return (
              <YearChip
                key={item.year}
                info={item}
                theme={theme}
                picked={index === focusYearIdx}
                onPick={() => setPickedYear(index)}
              />
            );
          })}
        </div>
      </div>

      <div ref={monthRef} className="fortune-section">
        <SectionHeader title="流月" caption={`${currentSolarYear} 年 12 个流月 · 当前 ${focusMonth.monthChinese}`} tone="ritual" />
        <FortuneFeatureCard
          kind="month"
          title={`${focusMonth.monthChinese} · ${focusMonth.ganZhi}`}
          sub={focusMonth.isCurrent ? '本月' : ''}
          isCurrent={focusMonth.isCurrent}
          theme={monthTheme}
        />
        <div className="fortune-rail month-rail">
          {months.map((item, index) => {
            const theme = computeMonthTheme(member, item.ganZhi, item.index);
            return (
              <MonthChip
                key={item.index}
                info={item}
                theme={theme}
                picked={index === focusMonthIdx}
                onPick={() => setPickedMonth(index)}
              />
            );
          })}
        </div>
      </div>

      {/* 浮动返回顶部 · 滚动后出现 · 跟随用户当前位置 */}
      <button
        type="button"
        className={`fortune-back-to-top${showBackToTop ? ' is-visible' : ''}`}
        onClick={resetToNow}
        aria-label="回当下"
      >
        <span className="bt-arrow" aria-hidden="true">↑</span>
        <span className="bt-text">回当下</span>
      </button>
    </main>
  );
}

function SectionHeader({ title, caption, tone }: { title: string; caption: string; tone?: 'now' | 'today' | 'ritual' | 'deep' }) {
  return (
    <header className="section-head" data-tone={tone ?? 'now'}>
      <h3>{title}</h3>
      <p>{caption}</p>
    </header>
  );
}

function helpToPolarity(help: FortuneTheme['bodyHelp']): 'do' | 'dont' | 'neutral' {
  if (help === 'support') return 'do';
  if (help === 'press' || help === 'drain') return 'dont';
  return 'neutral';
}

// bodyHelp → 0-100 视觉强度（spectrum 用）
function helpToPct(help: FortuneTheme['bodyHelp']): number {
  if (help === 'support') return 88;
  if (help === 'drain') return 55;
  if (help === 'press') return 42;
  return 70;
}

function plainExplain(theme: FortuneTheme): string {
  // 优先按 shishen 出具体白话 · 回退到 bodyHelp 通用文案
  const shishenPlain: Record<string, string> = {
    比肩: '人脉年 · 多和同频伙伴交流 · 但要先把分工说清楚 · 别因为人情吃亏',
    劫财: '钱包注意年 · 别和朋友 / 兄弟搅在一个账上 · 控制冲动消费 · 慢攒胜过快翻倍',
    食神: '创作输出年 · 把想法做成作品 · 但要懂得收尾 · 别开太多坑',
    伤官: '锋芒年 · 才华会被看见 · 但说话讲场合 · 别和领导 / 规矩硬刚',
    偏财: '机会年 · 抓短窗口 · 但同时铺多条线很费精力 · 该选就选',
    正财: '稳积累年 · 本职多投入 · 婚姻 / 置业 / 长期资产的好时机',
    七杀: '硬仗年 · 啃难题 · 抗压能力会涨 · 但守好身体 / 别冲动',
    正官: '规矩年 · 走流程 / 考证 / 晋升的好时机 · 别太在意外界评价',
    偏印: '深耕年 · 适合一个人钻研冷门 · 但别脱离群体太久',
    正印: '受教年 · 学习 / 接受指导 / 长辈会有支持'
  };
  if (shishenPlain[theme.shishen]) return shishenPlain[theme.shishen];
  if (theme.bodyHelp === 'support') return '这段时间顺风 · 主动推核心目标 · 反馈最快';
  if (theme.bodyHelp === 'press') return '这段时间阻力大 · 守住核心 · 等下个气口再发力';
  if (theme.bodyHelp === 'drain') return '这段时间易透支 · 减负 = 续航 · 别加新承诺';
  return '这段时间偏中性 · 按既定节奏稳推 · 不冒进';
}

// 动作权重 · 改用「顺势 / 阻力」表达 · 比"建议做权重"更直观
function ActionBalance({ theme }: { theme: FortuneTheme }) {
  const supportPct = helpToPct(theme.bodyHelp);
  const resistPct = 100 - supportPct;
  return (
    <div className="action-balance">
      <div className="ab-row">
        <span className="ab-label ab-label-do">顺势能量</span>
        <div className="energy-spectrum tone-do">
          <div className="es-bar"><span className="es-fill" style={{ width: `${supportPct}%` }} /></div>
          <span className="es-num">{supportPct}%</span>
        </div>
      </div>
      <div className="ab-row">
        <span className="ab-label ab-label-dont">阻力能量</span>
        <div className="energy-spectrum tone-dont">
          <div className="es-bar"><span className="es-fill" style={{ width: `${resistPct}%` }} /></div>
          <span className="es-num">{resistPct}%</span>
        </div>
      </div>
      <p className="ab-foot">顺势 = 这段时间帮你的能量 · 阻力 = 要消耗你的能量 · 加起来 = 100%</p>
    </div>
  );
}

// 大运/流年/流月 主卡 · 复用 family-feature-card 玻璃风
function FortuneFeatureCard({
  kind,
  title,
  sub,
  isCurrent,
  theme
}: {
  kind: 'decade' | 'year' | 'month';
  title: string;
  sub: string;
  isCurrent: boolean;
  theme: FortuneTheme;
}) {
  const polarity = helpToPolarity(theme.bodyHelp);
  const kindLabel = kind === 'decade' ? 'DECADE · 大运' : kind === 'year' ? 'YEAR · 流年' : 'MONTH · 流月';
  return (
    <article className={`family-feature-card fortune-feature-card polarity-${polarity}`}>
      <div className="ff-eyebrow">
        <span>{kindLabel}{sub ? ` · ${sub}` : ''}</span>
        <b>{theme.helpLabel}</b>
      </div>
      <p className="ff-headline">
        <strong>{title}</strong>
        {isCurrent && <span className="ff-now-tag">当下</span>}
      </p>
      <p className="ff-theme-word">{theme.themeWord} · {theme.shishen}</p>
      <p className="ff-narrative">{theme.narrative}</p>
      <div className="ff-plain-block">
        <span className="ff-plain-label">直白</span>
        <p className="ff-plain">{plainExplain(theme)}</p>
      </div>
      <ActionBalance theme={theme} />
    </article>
  );
}

// 当前大运/流年/流月 brief KPI · 复用 family-kpi-card
function FortuneKPICard({
  label,
  main,
  sub,
  helpLabel,
  tone,
  pct
}: {
  label: string;
  main: string;
  sub: string;
  helpLabel: string;
  tone: 'do' | 'dont' | 'neutral';
  pct: number;
}) {
  return (
    <article className={`family-kpi-card tone-${tone}`}>
      <div className="kpi-head">
        <span className="kpi-label">{label}</span>
        <span className="kpi-icon">▦</span>
      </div>
      <div className="kpi-num">
        <strong>{pct}</strong>
        <span>%</span>
      </div>
      <div className="kpi-meta">
        <div className="kpi-meta-cell">
          <b>{main}</b>
          <span>{sub}</span>
        </div>
        <div className="kpi-meta-cell">
          <b>{helpLabel}</b>
          <span>本周期气性</span>
        </div>
      </div>
      <div className={`energy-spectrum kpi-spectrum tone-${tone}`}>
        <div className="es-bar"><span className="es-fill" style={{ width: `${pct}%` }} /></div>
      </div>
    </article>
  );
}

function DecadeChip({
  info,
  picked,
  onPick
}: {
  info: DecadeFortuneInfo;
  picked: boolean;
  onPick: () => void;
}) {
  return (
    <button
      type="button"
      className={`fortune-chip${info.isCurrent ? ' is-current' : ''}${picked ? ' is-picked' : ''}`}
      onClick={onPick}
    >
      <span className="chip-no">第 {info.index + 1} 步</span>
      <strong>{info.ganZhi}</strong>
      <em>{info.startAge}–{info.endAge} 岁</em>
      <em className="chip-extra">{info.startYear}–{info.endYear}</em>
      {info.isCurrent && <b className="now-tag">当下</b>}
    </button>
  );
}

function YearChip({
  info,
  theme,
  picked,
  onPick
}: {
  info: YearFortuneInfo;
  theme: FortuneTheme;
  picked: boolean;
  onPick: () => void;
}) {
  const polarity = helpToPolarity(theme.bodyHelp);
  return (
    <button
      type="button"
      className={`fortune-chip year-chip polarity-${polarity}${info.isCurrent ? ' is-current' : ''}${picked ? ' is-picked' : ''}`}
      onClick={onPick}
    >
      <span className="chip-no">{info.age} 岁</span>
      <strong>{info.year}</strong>
      <em>{info.ganZhi}</em>
      <em className="chip-extra">{theme.shishen}</em>
      {info.isCurrent && <b className="now-tag">本年</b>}
    </button>
  );
}

function MonthChip({
  info,
  theme,
  picked,
  onPick
}: {
  info: MonthFortuneInfo;
  theme: FortuneTheme;
  picked: boolean;
  onPick: () => void;
}) {
  const polarity = helpToPolarity(theme.bodyHelp);
  return (
    <button
      type="button"
      className={`fortune-chip month-chip polarity-${polarity}${info.isCurrent ? ' is-current' : ''}${picked ? ' is-picked' : ''}`}
      onClick={onPick}
    >
      <span className="chip-no">{info.monthChinese}</span>
      <strong>{info.ganZhi}</strong>
      <em>{theme.shishen}</em>
      {info.isCurrent && <b className="now-tag">本月</b>}
    </button>
  );
}
