import { useMemo, useState } from 'react';
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
}

export function FortunePage({ members, primaryIds }: Props) {
  const [whoId, setWhoId] = useState(primaryIds[0]);
  const member = members.find(m => m.id === whoId)!;
  const decades = useMemo(() => computeDecadeFortunes(member, 8), [member]);
  const currentDecadeIdx = useMemo(() => {
    const i = decades.findIndex(d => d.isCurrent);
    return i >= 0 ? i : 0;
  }, [decades]);
  const [pickedDecade, setPickedDecade] = useState<number | null>(null);
  const focusDecadeIdx = pickedDecade ?? currentDecadeIdx;
  const focusDecade = decades[focusDecadeIdx];

  const years = useMemo(() => computeYearFortunes(member, focusDecadeIdx), [member, focusDecadeIdx]);
  const currentYearIdx = useMemo(() => {
    const i = years.findIndex(y => y.isCurrent);
    return i >= 0 ? i : 0;
  }, [years]);
  const [pickedYear, setPickedYear] = useState<number | null>(null);
  const focusYearIdx = pickedYear ?? currentYearIdx;
  const focusYear = years[focusYearIdx];

  const currentSolarYear = new Date().getFullYear();
  const months = useMemo(() => computeMonthFortunes(member, currentSolarYear), [member, currentSolarYear]);
  const currentMonthIdx = useMemo(() => {
    const i = months.findIndex(m => m.isCurrent);
    return i >= 0 ? i : new Date().getMonth();
  }, [months]);
  const [pickedMonth, setPickedMonth] = useState<number | null>(null);
  const focusMonthIdx = pickedMonth ?? currentMonthIdx;
  const focusMonth = months[focusMonthIdx];

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

  return (
    <main className="page fortune-page" style={{ '--accent': member.color } as CSSProperties}>

      {/* Hero · 牛 / 嘻切换 */}
      <section className="fortune-hero">
        <div>
          <p className="eyebrow">长程时间维度 · 大运 / 流年 / 流月</p>
          <h2>{member.name}</h2>
          <p className="muted small">由 tyme4ts 按节气推算 · 主题叙事来自十神 + 用神{member.yong} 关系</p>
        </div>
        <div className="brief-actions">
          {primaryIds.map(id => {
            const m = members.find(x => x.id === id)!;
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
                {m.name}
              </button>
            );
          })}
        </div>
      </section>

      {/* 段 1 · 当下大运 主位 */}
      <SectionHeader title="大运" caption="十年一柱 · 选一步看主题" />
      <FortuneMain
        kind="decade"
        title={`第 ${focusDecade.index + 1} 步大运 · ${focusDecade.ganZhi}`}
        sub={`${focusDecade.startAge}-${focusDecade.endAge} 岁 · ${focusDecade.startYear}-${focusDecade.endYear}`}
        isCurrent={focusDecade.isCurrent}
        theme={computeDecadeTheme(member, focusDecade.ganZhi)}
      />

      {/* 段 2 · 大运时间轴 chip 联动 */}
      <div className="fortune-rail">
        {decades.map(d => (
          <DecadeChip
            key={d.index}
            info={d}
            picked={d.index === focusDecadeIdx}
            onPick={() => setPickedDecade(d.index)}
          />
        ))}
      </div>

      {/* 段 3 · 当下流年 主位 */}
      <SectionHeader title="流年" caption={`所选大运的 10 个流年 · 当前 ${focusYear.year}`} />
      <FortuneMain
        kind="year"
        title={`${focusYear.year} 年 · ${focusYear.ganZhi}`}
        sub={`${focusYear.age} 岁`}
        isCurrent={focusYear.isCurrent}
        theme={computeYearTheme(member, focusYear.ganZhi, focusYear.year)}
      />

      {/* 段 4 · 流年盘 chip 联动 */}
      <div className="fortune-rail year-rail">
        {years.map((y, i) => {
          const t = computeYearTheme(member, y.ganZhi, y.year);
          return (
            <YearChip
              key={y.year}
              info={y}
              theme={t}
              picked={i === focusYearIdx}
              onPick={() => setPickedYear(i)}
            />
          );
        })}
      </div>

      {/* 段 5 · 当下流月 主位 */}
      <SectionHeader title="流月" caption={`${currentSolarYear} 年 12 个流月 · 当前 ${focusMonth.monthChinese}`} />
      <FortuneMain
        kind="month"
        title={`${focusMonth.monthChinese} · ${focusMonth.ganZhi}`}
        sub={focusMonth.isCurrent ? '本月' : ''}
        isCurrent={focusMonth.isCurrent}
        theme={computeMonthTheme(member, focusMonth.ganZhi, focusMonth.index)}
      />

      {/* 段 6 · 流月盘 12 月按吉凶上色 */}
      <div className="fortune-rail month-rail">
        {months.map((m, i) => {
          const t = computeMonthTheme(member, m.ganZhi, m.index);
          return (
            <MonthChip
              key={m.index}
              info={m}
              theme={t}
              picked={i === focusMonthIdx}
              onPick={() => setPickedMonth(i)}
            />
          );
        })}
      </div>
    </main>
  );
}

function SectionHeader({ title, caption }: { title: string; caption: string }) {
  return (
    <header className="section-head">
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

function FortuneMain({
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
  return (
    <article className={`fortune-main fortune-${kind} polarity-${polarity}`}>
      <header>
        <div className="main-head-left">
          <h4>{title}</h4>
          {sub && <p className="muted small">{sub}</p>}
        </div>
        <div className="main-head-right">
          {isCurrent && <span className="now-tag">当下</span>}
          <span className={`help-chip help-${theme.bodyHelp}`}>{theme.helpLabel}</span>
        </div>
      </header>
      <p className="theme-word">{theme.themeWord}</p>
      <p className="narrative">{theme.narrative}</p>
      {(theme.goodFor.length > 0 || theme.watchOut.length > 0) && (
        <div className="polarity-grid">
          {theme.goodFor.length > 0 && (
            <div className="polarity-col polarity-do">
              <span className="polarity-label">必做</span>
              <ul>{theme.goodFor.slice(0, 3).map(t => <li key={t}>{t}</li>)}</ul>
            </div>
          )}
          {theme.watchOut.length > 0 && (
            <div className="polarity-col polarity-dont">
              <span className="polarity-label">不做</span>
              <ul>{theme.watchOut.slice(0, 3).map(t => <li key={t}>{t}</li>)}</ul>
            </div>
          )}
        </div>
      )}
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
