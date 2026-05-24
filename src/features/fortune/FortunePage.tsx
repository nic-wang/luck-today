import { useMemo, useState } from 'react';
import type { CSSProperties } from 'react';
import {
  computeDecadeFortunes,
  computeMonthFortunes,
  computeYearFortunes,
  type DecadeFortuneInfo
} from '../../engine/adapters/tyme4ts';
import type { MemberProfile } from '../../types';

interface FortunePageProps {
  members: MemberProfile[];
  primaryIds: string[];
}

export function FortunePage({ members, primaryIds }: FortunePageProps) {
  const [whoId, setWhoId] = useState(primaryIds[0]);
  const member = members.find(m => m.id === whoId)!;
  const decades = useMemo(() => computeDecadeFortunes(member, 8), [member]);
  const currentDecadeIdx = useMemo(() => {
    const idx = decades.findIndex(d => d.isCurrent);
    return idx >= 0 ? idx : 0;
  }, [decades]);
  const [pickedDecade, setPickedDecade] = useState<number | null>(null);
  const focusDecadeIdx = pickedDecade ?? currentDecadeIdx;

  const years = useMemo(() => computeYearFortunes(member, focusDecadeIdx), [member, focusDecadeIdx]);
  const currentYear = new Date().getFullYear();
  const months = useMemo(() => computeMonthFortunes(member, currentYear), [member, currentYear]);

  if (decades.length === 0) {
    return (
      <main className="page fortune-page">
        <section className="panel">
          <p className="eyebrow">Fortune Engine</p>
          <h2>大运 / 流年 / 流月</h2>
          <p className="muted">{member.name} 暂无完整出生信息（需要年月日 + 性别），无法推算大运。</p>
        </section>
      </main>
    );
  }

  return (
    <main className="page fortune-page">
      <section className="panel fortune-hero" style={{ '--accent': member.color } as CSSProperties}>
        <div>
          <p className="eyebrow">Fortune · 长程时间维度</p>
          <h2>{member.name} · 大运 / 流年 / 流月</h2>
          <p className="muted">大运 10 年一变 · 流年 1 年一柱 · 流月 1 月一柱 · 由 tyme4ts 引擎按节气推算</p>
        </div>
        <div className="brief-actions">
          {primaryIds.map(id => {
            const m = members.find(x => x.id === id)!;
            return (
              <button
                key={id}
                type="button"
                className={whoId === id ? 'active' : ''}
                onClick={() => { setWhoId(id); setPickedDecade(null); }}
              >
                {m.name}
              </button>
            );
          })}
        </div>
      </section>

      <section className="panel decade-rail-panel">
        <div className="panel-title">
          <p className="eyebrow"><span className="dot" /> 大运时间轴</p>
          <h3>人生 8 步大运</h3>
        </div>
        <div className="decade-rail">
          {decades.map(d => (
            <DecadeChip
              key={d.index}
              info={d}
              picked={d.index === focusDecadeIdx}
              onPick={() => setPickedDecade(d.index)}
            />
          ))}
        </div>
        <p className="muted small">点选某一步大运，下方流年盘随之联动。</p>
      </section>

      <section className="panel year-grid-panel">
        <div className="panel-title">
          <p className="eyebrow"><span className="dot" /> 流年盘</p>
          <h3>所选大运的 10 个流年</h3>
        </div>
        <div className="year-grid">
          {years.map(y => (
            <article className={`year-cell${y.isCurrent ? ' is-current' : ''}`} key={y.year}>
              <span className="age">{y.age} 岁</span>
              <strong>{y.year}</strong>
              <em>{y.ganZhi}</em>
              {y.isCurrent && <b className="now-tag">本年</b>}
            </article>
          ))}
        </div>
      </section>

      <section className="panel month-grid-panel">
        <div className="panel-title">
          <p className="eyebrow"><span className="dot" /> 流月盘</p>
          <h3>{currentYear} 年 12 个流月</h3>
        </div>
        <div className="month-grid">
          {months.map(mn => (
            <article className={`month-cell${mn.isCurrent ? ' is-current' : ''}`} key={mn.index}>
              <span>{mn.monthChinese}</span>
              <strong>{mn.ganZhi}</strong>
              {mn.isCurrent && <b className="now-tag">本月</b>}
            </article>
          ))}
        </div>
        <p className="muted small">流月按节气月切分（每月 15 号读取月柱，避开月头节气边界）。</p>
      </section>
    </main>
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
      className={`decade-chip${info.isCurrent ? ' is-current' : ''}${picked ? ' is-picked' : ''}`}
      onClick={onPick}
    >
      <span className="decade-no">第 {info.index + 1} 步</span>
      <strong>{info.ganZhi}</strong>
      <em>{info.startAge}–{info.endAge} 岁</em>
      <em className="years">{info.startYear}–{info.endYear}</em>
      {info.isCurrent && <b className="now-tag">当下</b>}
    </button>
  );
}
