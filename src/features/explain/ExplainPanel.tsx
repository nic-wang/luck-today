import type { AlgorithmFactor, AlgorithmVersion, DailyLuckResult, LuckTier } from '../../types';

const TIER_LABEL: Record<LuckTier, string> = {
  deterministic: '确定层',
  interpretive: '解释层',
  ritual: '仪式层'
};

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

export function ExplainPanel({ version, daily }: { version: AlgorithmVersion; daily: DailyLuckResult[] }) {
  const primary = daily[0];

  return (
    <main className="page explain-page">
      <section className="panel hex-card">
        <div>
          <p className="eyebrow">Hex Radar</p>
          <h2>六边形得分图</h2>
          <p className="muted">把核心分数压成 6 个点：事业、财运、社交、健康、时机、仪式。</p>
          <div className="radar-legend-list">
            {daily.map((item, index) => (
              <span key={item.memberId}><i style={{ background: index === 0 ? '#5c8a6b' : '#c9a26b' }} />{item.memberId === 'niu' ? '牛牛' : '嘻嘻'}</span>
            ))}
          </div>
        </div>
        <HexRadar daily={daily} />
      </section>

      <section className="hex-detail-grid">
        {primary.radar.map(point => (
          <article className="hex-detail" key={point.id}>
            <span>{point.label}</span>
            <strong>{point.value}</strong>
            <p>{point.summary}</p>
            <em>{point.detail}</em>
          </article>
        ))}
      </section>

      <section className="panel version-card compact-version">
        <div>
          <p className="eyebrow">Algorithm Trace</p>
          <h2>{version.title}</h2>
          <p className="muted">当前版本：{version.version}</p>
        </div>
        <div className="version-notes">
          {version.notes.map(note => <span key={note}>✓ {note}</span>)}
        </div>
      </section>

      <section className="explain-grid">
        {daily.map(item => (
          <article className="panel" key={item.memberId}>
            <div className="panel-title">
              <p className="eyebrow">Trace</p>
              <h3>{item.memberId === 'niu' ? '牛牛' : '嘻嘻'} · {item.label}</h3>
            </div>
            <p>{item.explanation}</p>
            <div className="dimension-list">
              {Object.entries(item.dimensions).map(([key, value]) => (
                <div key={key}>
                  <span>{key}</span>
                  <div><i style={{ width: `${value}%` }} /></div>
                  <b>{value}</b>
                </div>
              ))}
            </div>
            <details className="explain-details" open>
              <summary>
                <span>为什么这样算</span>
                <b>{item.factors.length} 个因子</b>
              </summary>
              <div className="factor-list">
                {item.factors.map(factor => (
                  <FactorBlock key={factor.id} factor={factor} />
                ))}
              </div>
            </details>
          </article>
        ))}
      </section>
    </main>
  );
}

function HexRadar({ daily }: { daily: DailyLuckResult[] }) {
  const size = 360;
  const center = size / 2;
  const radius = 132;
  const axes = daily[0].radar;
  const colors = ['#5c8a6b', '#c9a26b'];

  function point(index: number, value = 100) {
    const angle = (-90 + index * 60) * Math.PI / 180;
    const r = radius * (value / 100);
    return [center + Math.cos(angle) * r, center + Math.sin(angle) * r];
  }

  function polygon(values: number[]) {
    return values.map((value, index) => point(index, value).join(',')).join(' ');
  }

  return (
    <svg className="hex-radar" viewBox={`0 0 ${size} ${size}`} role="img" aria-label="六边形得分图">
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
      {daily.map((item, index) => (
        <polygon
          key={item.memberId}
          points={polygon(item.radar.map(axis => axis.value))}
          fill={colors[index]}
          stroke={colors[index]}
          className="hex-fill"
        />
      ))}
      <circle cx={center} cy={center} r="4" fill="#17211b" />
    </svg>
  );
}
