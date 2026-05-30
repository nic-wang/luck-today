import { useState } from 'react';
import type { AlgorithmFactor, AlgorithmVersion, DailyLuckResult, LuckTier } from '../../types';

const TIER_LABEL: Record<LuckTier, string> = {
  deterministic: '命定',
  interpretive: '推演',
  ritual: '心相'
};

const FOCUS_COLOR = '#5c8a6b';

interface Props {
  version: AlgorithmVersion;
  daily: DailyLuckResult[];
  focusId: string;
}

export function ExplainPanel({ version, daily, focusId }: Props) {
  // 单人视角 · 只看 focusId 一份
  const item = daily.find(d => d.memberId === focusId) ?? daily[0];
  const [activeDim, setActiveDim] = useState<string | null>(null);

  return (
    <main className="page explain-page">

      {/* 模块 1 · 今日得分矩阵 */}
      <section className="score-matrix">
        <header className="matrix-head">
          <h2>今日得分矩阵</h2>
          <p className="muted small">{item.memberId === 'niu' ? '牛牛' : '嘻嘻'} · 由 6 个维度按权重合成 · 点 chip 看详情</p>
        </header>
        <div className="matrix-body">
          <HexRadar item={item} />
        </div>
        <div className="dim-chip-row" role="tablist" aria-label="维度详情">
          {item.radar.map(axis => {
            const polarity = polarityFor(axis.value);
            return (
              <button
                key={axis.id}
                type="button"
                role="tab"
                aria-selected={activeDim === axis.id}
                className={`dim-chip${activeDim === axis.id ? ' is-active' : ''} polarity-${polarity}`}
                onClick={() => setActiveDim(activeDim === axis.id ? null : axis.id)}
              >
                <span className="chip-label">{axis.label}</span>
                <strong>{axis.value}</strong>
              </button>
            );
          })}
        </div>
      </section>

      {/* 模块 2 · 维度详情（chip 联动 · 默认折叠） */}
      {activeDim && (
        <section className="dim-detail-panel" aria-live="polite">
          <DimensionDetail axisId={activeDim} item={item} />
        </section>
      )}

      {/* 模块 3 · 因子追溯（折叠 · 默认收起） */}
      <details className="trace-fold">
        <summary>
          <span>想看推算过程？</span>
          <b>{item.factors.length} 个因子 · {item.memberId === 'niu' ? '牛牛' : '嘻嘻'} 视角</b>
        </summary>
        <div className="trace-grid trace-grid-solo">
          <div className="trace-col">
            <header>
              <span className="trace-name">{item.memberId === 'niu' ? '牛牛' : '嘻嘻'}</span>
              <em className="trace-score">{item.score}</em>
            </header>
            <div className="factor-list">
              {item.factors.map(factor => <FactorBlock key={factor.id} factor={factor} />)}
            </div>
          </div>
        </div>
      </details>

      {/* 模块 4 · 页脚 算法版本 */}
      <footer className="algo-footer">
        <span className="muted small">算法版本</span>
        <strong>{version.version}</strong>
        <p className="muted small">{version.notes.join(' · ')}</p>
      </footer>
    </main>
  );
}

function polarityFor(score: number): 'high' | 'mid' | 'low' {
  if (score >= 76) return 'high';
  if (score >= 60) return 'mid';
  return 'low';
}

function DimensionDetail({ axisId, item }: { axisId: string; item: DailyLuckResult }) {
  const axis = item.radar.find(a => a.id === axisId);
  if (!axis) return null;
  const polarity = polarityFor(axis.value);
  return (
    <div className="dim-detail-grid">
      <article className={`dim-detail polarity-${polarity}`}>
        <header>
          <span className="dim-name">{item.memberId === 'niu' ? '牛牛' : '嘻嘻'} · {axis.label}</span>
          <strong className="dim-score">{axis.value}</strong>
          <span className="polarity">{polarity === 'high' ? '强势' : polarity === 'mid' ? '中性' : '守为主'}</span>
        </header>
        <p className="conclusion"><strong>{axis.summary}</strong></p>
        <p className="muted">{axis.detail}</p>
        <ul className="dim-evidence">
          {item.factors.slice(0, 3).map(f => (
            <li key={f.id}>
              <span className="tier-chip" data-tier={f.tier}>{TIER_LABEL[f.tier]}</span>
              <b>{f.label}</b>
              <em>{f.value}</em>
            </li>
          ))}
        </ul>
      </article>
    </div>
  );
}

function FactorBlock({ factor }: { factor: AlgorithmFactor }) {
  const dots = Math.max(1, Math.min(5, Math.round(factor.weight * 5)));
  return (
    <div className={`factor factor-${factor.tier}`}>
      <div className="factor-head">
        <span className="factor-tier-chip" data-tier={factor.tier}>{TIER_LABEL[factor.tier]}</span>
        <span className="label">{factor.label}</span>
        <span className="factor-weight" title={`权重 ${factor.weight.toFixed(2)}`}>{'·'.repeat(dots)}</span>
      </div>
      <strong>{factor.value}</strong>
      <p>{factor.explanation}</p>
    </div>
  );
}

function HexRadar({ item }: { item: DailyLuckResult }) {
  const size = 360;
  const center = size / 2;
  const radius = 132;
  const axes = item.radar;

  function point(index: number, value = 100) {
    const angle = (-90 + index * 60) * Math.PI / 180;
    const r = radius * (value / 100);
    return [center + Math.cos(angle) * r, center + Math.sin(angle) * r];
  }

  function polygon(values: number[]) {
    return values.map((value, index) => point(index, value).join(',')).join(' ');
  }

  return (
    <svg className="hex-radar" viewBox={`0 0 ${size} ${size}`} role="img" aria-label="今日得分矩阵">
      {[25, 50, 75, 100].map(level => (
        <polygon key={level} points={polygon(axes.map(() => level))} className="hex-grid" />
      ))}
      {axes.map((axis, index) => {
        const [x1, y1] = point(index, 0);
        const [x2, y2] = point(index, 100);
        const [tx, ty] = point(index, 112);
        return (
          <g key={axis.id}>
            <line x1={x1} y1={y1} x2={x2} y2={y2} className="hex-axis" />
            <text x={tx} y={ty} textAnchor="middle" dominantBaseline="middle">{axis.label}</text>
          </g>
        );
      })}
      <polygon
        points={polygon(item.radar.map(axis => axis.value))}
        fill={FOCUS_COLOR}
        stroke={FOCUS_COLOR}
        className="hex-fill"
      />
      <circle cx={center} cy={center} r="4" fill="#15181c" />
    </svg>
  );
}
