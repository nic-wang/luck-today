import { useMemo, useState } from 'react';
import type { CSSProperties } from 'react';
import { computeZiweiChart, type ZiweiPalace } from '../../engine/adapters/iztro';
import { paceNarrative, ZIWEI_VS_BAZI_NOTE } from '../../engine/ziwei-theme';
import type { MemberProfile } from '../../types';

// 紫微 12 宫的标准盘面位置（4×4 围一圈 · 中央 2×2 留给命主/身主）
// iztro palaces 数组按地支顺序，需要按地支映射到固定盘面坐标
//
// 标准盘面：
//   巳  午  未  申     ← 顶行
//   辰  [center]  酉
//   卯  [center]  戌
//   寅  丑  子  亥     ← 底行
const BRANCH_TO_GRID_POS: Record<string, { row: number; col: number }> = {
  巳: { row: 1, col: 1 }, 午: { row: 1, col: 2 }, 未: { row: 1, col: 3 }, 申: { row: 1, col: 4 },
  辰: { row: 2, col: 1 },                                                 酉: { row: 2, col: 4 },
  卯: { row: 3, col: 1 },                                                 戌: { row: 3, col: 4 },
  寅: { row: 4, col: 1 }, 丑: { row: 4, col: 2 }, 子: { row: 4, col: 3 }, 亥: { row: 4, col: 4 }
};

interface Props {
  members: MemberProfile[];
  primaryIds: string[];
}

export function ZiweiPage({ members, primaryIds }: Props) {
  const [whoId, setWhoId] = useState(primaryIds[0]);
  const member = members.find(m => m.id === whoId)!;
  const chart = useMemo(() => computeZiweiChart(member), [member]);
  const [pickedPalace, setPickedPalace] = useState<number | null>(null);

  if (!chart) {
    return (
      <main className="page ziwei-page">
        <section className="fortune-empty panel">
          <h2>{member.name} · 紫微命盘</h2>
          <p className="muted">暂无完整出生信息（需要年月日 + 时辰 + 性别），无法起命盘。</p>
        </section>
      </main>
    );
  }

  const soulPalace = chart.palaces.find(p => p.isSoulPalace) ?? chart.palaces[0];
  const focusPalace = pickedPalace !== null
    ? chart.palaces[pickedPalace]
    : soulPalace;

  return (
    <main className="page ziwei-page" style={{ '--accent': member.color } as CSSProperties}>

      <section className="fortune-hero">
        <div>
          <p className="eyebrow">紫微斗数 · 12 宫命盘</p>
          <h2>{member.name}</h2>
          <p className="muted small">
            命主 <b>{chart.soul}</b> · 身主 <b>{chart.body}</b> · {chart.fiveElementsClass} · {chart.zodiac}座
          </p>
        </div>
        <div className="brief-actions">
          {primaryIds.map(id => {
            const m = members.find(x => x.id === id)!;
            return (
              <button
                key={id}
                type="button"
                className={whoId === id ? 'active' : ''}
                onClick={() => { setWhoId(id); setPickedPalace(null); }}
              >
                {m.name}
              </button>
            );
          })}
        </div>
      </section>

      {/* 12 宫盘面 */}
      <SectionHeader title="12 宫盘面" caption="点任一宫看主题解读 · 中央显示命主 / 身主 / 五行局" />
      <div className="ziwei-grid">
        {chart.palaces.map(p => {
          const pos = BRANCH_TO_GRID_POS[p.earthlyBranch];
          if (!pos) return null;
          const focused = pickedPalace !== null
            ? p.index === pickedPalace
            : p.isSoulPalace;
          return (
            <PalaceCell
              key={p.index}
              palace={p}
              row={pos.row}
              col={pos.col}
              focused={focused}
              onPick={() => setPickedPalace(p.index)}
            />
          );
        })}
        <div className="ziwei-center">
          <p className="eyebrow">命主 / 身主</p>
          <strong>{chart.soul} / {chart.body}</strong>
          <p className="muted small">{chart.fiveElementsClass}</p>
          <p className="muted small">阳历 {chart.solarDate}</p>
          <p className="muted small">农历 {chart.lunarDate}</p>
        </div>
      </div>

      {/* 焦点宫主位卡 */}
      <SectionHeader title="焦点宫" caption="默认命宫 · 点上面任一宫切换" />
      <PalaceMain palace={focusPalace} />

      {/* 与八字的对照（折叠） */}
      <details className="ziwei-vs-bazi">
        <summary>
          <span>八字 vs 紫微 · 两套体系怎么配合</span>
          <b>对照视角</b>
        </summary>
        <div className="vs-grid">
          <article className="vs-col">
            <h4>八字</h4>
            <p>{ZIWEI_VS_BAZI_NOTE.bazi}</p>
          </article>
          <article className="vs-col">
            <h4>紫微</h4>
            <p>{ZIWEI_VS_BAZI_NOTE.ziwei}</p>
          </article>
        </div>
        <p className="vs-conclusion"><strong>{ZIWEI_VS_BAZI_NOTE.conclusion}</strong></p>
      </details>
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

function PalaceCell({
  palace,
  row,
  col,
  focused,
  onPick
}: {
  palace: ZiweiPalace;
  row: number;
  col: number;
  focused: boolean;
  onPick: () => void;
}) {
  return (
    <button
      type="button"
      className={[
        'palace-cell',
        focused ? 'is-focused' : '',
        palace.isSoulPalace ? 'is-soul' : '',
        palace.isBodyPalace ? 'is-body' : ''
      ].filter(Boolean).join(' ')}
      style={{ gridRow: row, gridColumn: col }}
      onClick={onPick}
    >
      <header>
        <span className="palace-name">{palace.name}</span>
        {palace.isSoulPalace && <em className="palace-tag soul-tag">命</em>}
        {palace.isBodyPalace && <em className="palace-tag body-tag">身</em>}
      </header>
      <div className="palace-gz">{palace.heavenlyStem}{palace.earthlyBranch}</div>
      {palace.majorStars.length > 0 ? (
        <div className="palace-major">
          {palace.majorStars.slice(0, 2).map((s, i) => (
            <span key={s} className="star-major">
              {s}
              {palace.brightness[i] && <em>{palace.brightness[i]}</em>}
            </span>
          ))}
        </div>
      ) : (
        <div className="palace-major no-star">无主星</div>
      )}
      {palace.minorStars.length > 0 && (
        <div className="palace-minor">
          {palace.minorStars.slice(0, 4).map(s => <span key={s}>{s}</span>)}
        </div>
      )}
    </button>
  );
}

function PalaceMain({ palace }: { palace: ZiweiPalace }) {
  const n = paceNarrative(palace);
  return (
    <article className="palace-main">
      <header>
        <div>
          <h4>{palace.name} · {n.aspect}</h4>
          <p className="muted small">{palace.heavenlyStem}{palace.earthlyBranch}{palace.isSoulPalace ? ' · 命宫' : palace.isBodyPalace ? ' · 身宫' : ''}</p>
        </div>
        <div className="palace-main-stars">
          {palace.majorStars.map((s, i) => (
            <span key={s} className="star-major-large">
              {s}{palace.brightness[i] ? <em>{palace.brightness[i]}</em> : null}
            </span>
          ))}
        </div>
      </header>
      <p className="theme-word">{n.trait}</p>
      <p className="narrative">{n.narrative}</p>
      {palace.minorStars.length > 0 && (
        <div className="palace-minors">
          <span className="muted small">辅星 / 杂曜：</span>
          {palace.minorStars.map(s => <span key={s} className="minor-chip">{s}</span>)}
        </div>
      )}
    </article>
  );
}
