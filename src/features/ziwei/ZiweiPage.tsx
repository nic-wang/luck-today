import { useMemo, useState } from 'react';
import type { CSSProperties } from 'react';
import { computeZiweiChart, type ZiweiPalace } from '../../engine/adapters/iztro';
import { paceNarrative, ZIWEI_VS_BAZI_NOTE, ZIWEI_PRIMER } from '../../engine/ziwei-theme';
import type { MemberProfile } from '../../types';

// 紫微 12 宫的标准盘面位置（4×4 围一圈 · 中央 2×2 留给命主/身主）
const BRANCH_TO_GRID_POS: Record<string, { row: number; col: number }> = {
  巳: { row: 1, col: 1 }, 午: { row: 1, col: 2 }, 未: { row: 1, col: 3 }, 申: { row: 1, col: 4 },
  辰: { row: 2, col: 1 },                                                 酉: { row: 2, col: 4 },
  卯: { row: 3, col: 1 },                                                 戌: { row: 3, col: 4 },
  寅: { row: 4, col: 1 }, 丑: { row: 4, col: 2 }, 子: { row: 4, col: 3 }, 亥: { row: 4, col: 4 }
};

interface Props {
  members: MemberProfile[];
  primaryIds: string[];
  focusId: string;
  onFocusChange: (id: string) => void;
}

export function ZiweiPage({ members, primaryIds, focusId, onFocusChange }: Props) {
  const whoId = focusId;
  const setWhoId = onFocusChange;
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
      <section className="family-overview-shell ziwei-overview-shell">
        <header className="family-overview-head">
          <p className="eyebrow">ZIWEI · {member.name} · 紫微 12 宫命盘</p>
          <h2>Hi, {member.name}</h2>
          <p className="muted small">命主 {chart.soul} · 身主 {chart.body} · {chart.fiveElementsClass} · {chart.zodiac}座</p>
        </header>

        {primaryIds.length > 1 && (
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
        )}

        {/* 命主 / 身主 / 五行局 主卡 · 复用 family-feature-card 玻璃风 */}
        <article className="family-feature-card polarity-neutral">
          <div className="ff-eyebrow">
            <span>SOUL · 命格主轴</span>
            <b>{chart.fiveElementsClass}</b>
          </div>
          <p className="ff-headline">
            <strong>{chart.soul} / {chart.body}</strong>
          </p>
          <div className="ff-pair-meta">
            <span className="ff-meta-chip">命主 {chart.soul}</span>
            <span className="ff-meta-chip">身主 {chart.body}</span>
            <span className="ff-meta-chip">{chart.zodiac}座</span>
            <span className="ff-meta-chip">阳历 {chart.solarDate}</span>
            <span className="ff-meta-chip">农历 {chart.lunarDate}</span>
          </div>
        </article>
      </section>

      <details className="ziwei-primer-fold">
        <summary>
          <span>紫微入门 · 第一次看怎么读这盘</span>
          <b>4 个核心概念 · 5 分钟搞懂</b>
        </summary>
        <div className="primer-grid">
          <PrimerSection
            title={ZIWEI_PRIMER.twelvePalaces.title}
            body={ZIWEI_PRIMER.twelvePalaces.body}
            list={ZIWEI_PRIMER.twelvePalaces.list}
            tone="now"
          />
          <PrimerSection
            title={ZIWEI_PRIMER.soulVsBody.title}
            body={ZIWEI_PRIMER.soulVsBody.body}
            rows={ZIWEI_PRIMER.soulVsBody.rows}
            tone="today"
          />
          <PrimerSection
            title={ZIWEI_PRIMER.fiveElements.title}
            body={ZIWEI_PRIMER.fiveElements.body}
            rows={ZIWEI_PRIMER.fiveElements.rows}
            tone="ritual"
          />
          <PrimerSection
            title={ZIWEI_PRIMER.starTypes.title}
            body={ZIWEI_PRIMER.starTypes.body}
            rows={ZIWEI_PRIMER.starTypes.rows}
            tone="deep"
          />
        </div>
      </details>

      <div className="fortune-section">
        <SectionHeader title="12 宫盘面" caption="点任一宫看主题解读 · 中央显示命主 / 身主 / 五行局" tone="now" />
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
      </div>

      <div className="fortune-section">
        <SectionHeader title="焦点宫" caption="默认命宫 · 点上面任一宫切换" tone="today" />
        <PalaceMain palace={focusPalace} />
      </div>

      <details className="family-matrix-fold ziwei-vs-bazi">
        <summary>
          <span>八字 vs 紫微 · 两套体系怎么配合</span>
          <b>对照视角</b>
        </summary>
        <div className="vs-grid">
          <article className="vs-col vs-col-bazi">
            <h4>八字</h4>
            <p>{ZIWEI_VS_BAZI_NOTE.bazi}</p>
          </article>
          <article className="vs-col vs-col-ziwei">
            <h4>紫微</h4>
            <p>{ZIWEI_VS_BAZI_NOTE.ziwei}</p>
          </article>
        </div>
        <p className="vs-conclusion"><strong>{ZIWEI_VS_BAZI_NOTE.conclusion}</strong></p>
      </details>
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

function PrimerSection({ title, body, list, rows, tone }: {
  title: string;
  body: string;
  list?: Array<{ name: string; scope: string }>;
  rows?: Array<{ label: string; text: string }>;
  tone: 'now' | 'today' | 'ritual' | 'deep';
}) {
  return (
    <article className="primer-card" data-tone={tone}>
      <h4>{title}</h4>
      <p className="primer-body">{body}</p>
      {list && (
        <ul className="primer-list">
          {list.map(item => (
            <li key={item.name}>
              <b>{item.name}</b>
              <span>{item.scope}</span>
            </li>
          ))}
        </ul>
      )}
      {rows && (
        <ul className="primer-rows">
          {rows.map(row => (
            <li key={row.label}>
              <b>{row.label}</b>
              <span>{row.text}</span>
            </li>
          ))}
        </ul>
      )}
    </article>
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
  // 焦点宫 tone：命宫 → do · 身宫 → dont · 其他 → neutral
  const polarity = palace.isSoulPalace ? 'do' : palace.isBodyPalace ? 'dont' : 'neutral';
  const palaceTag = palace.isSoulPalace ? '命宫' : palace.isBodyPalace ? '身宫' : '一般宫位';
  return (
    <article className={`family-feature-card fortune-feature-card ziwei-feature-card polarity-${polarity}`}>
      <div className="ff-eyebrow">
        <span>PALACE · {palace.heavenlyStem}{palace.earthlyBranch} · {palaceTag}</span>
        <b>{n.aspect}</b>
      </div>
      <p className="ff-headline">
        <strong>{palace.name}</strong>
        {palace.isSoulPalace && <span className="ff-now-tag">命</span>}
        {palace.isBodyPalace && <span className="ff-now-tag">身</span>}
      </p>

      {/* 1. 宫意 · 一句话普及 */}
      <div className="palace-meaning-block">
        <span className="pmb-label">宫意</span>
        <p className="pmb-text">{n.meaning}</p>
      </div>

      {/* 2. 适用范围 · 具体看哪些事 */}
      <div className="palace-scope-block">
        <span className="psb-label">适用范围</span>
        <p className="psb-text">{n.scope}</p>
      </div>

      {/* 3. 直白解读 · 牛牛风 · 用户语言风格 */}
      <div className="ff-plain-block">
        <span className="ff-plain-label">直白</span>
        <div className="ff-plain-content">
          <p className="ff-plain">{n.plainNarrative}</p>
          <p className="ff-plain ff-plain-focus">先看这个：{n.plainFocus}</p>
        </div>
      </div>

      {/* 4. 专业层 · 主星 chips + 术语解读（次要 · 默认折叠 / 展开看）*/}
      <details className="palace-pro-fold">
        <summary>
          <span>展开专业层 · 主星 / 术语解读</span>
          <b>命理术语视角</b>
        </summary>
        <div className="palace-pro-body">
          {palace.majorStars.length > 0 && (
            <div className="palace-stars-row">
              {palace.majorStars.map((s, i) => (
                <span key={s} className="palace-star-chip">
                  {s}
                  {palace.brightness[i] && <em>{palace.brightness[i]}</em>}
                </span>
              ))}
            </div>
          )}
          <p className="ff-theme-word">{n.trait}</p>
          <p className="ff-narrative">{n.narrative}</p>
          {palace.minorStars.length > 0 && (
            <div className="palace-minors">
              <span className="palace-minors-label">辅星 / 杂曜</span>
              <div className="palace-minors-chips">
                {palace.minorStars.map(s => <span key={s} className="minor-chip">{s}</span>)}
              </div>
            </div>
          )}
        </div>
      </details>
    </article>
  );
}
