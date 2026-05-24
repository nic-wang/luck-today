import type { CSSProperties } from 'react';
import { useState } from 'react';
import type { QimenChart } from '../../engine/adapters/taobi';
import type { AlgorithmFactor, DailyLuckResult, LuckTier, MemberProfile } from '../../types';

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

const SUIT_LABEL: Record<NonNullable<DailyLuckResult['tarot']['suit']>, string> = {
  wands: '权杖 · 火',
  cups: '圣杯 · 水',
  swords: '宝剑 · 风',
  pentacles: '钱币 · 土'
};

function tarotArcanaLabel(
  arcana: DailyLuckResult['tarot']['arcana'],
  suit: DailyLuckResult['tarot']['suit']
): string {
  if (arcana === 'major') return '大阿尔卡纳';
  if (arcana === 'minor' && suit) return `小阿尔卡纳 · ${SUIT_LABEL[suit]}`;
  return '';
}

export function TodayPage({
  daily,
  focusId,
  onFocusChange,
  members
}: {
  daily: DailyLuckResult[];
  focusId: string;
  onFocusChange: (id: string) => void;
  members: MemberProfile[];
}) {
  const focus = daily.find(item => item.memberId === focusId) ?? daily[0];
  const focusMember = members.find(item => item.id === focus.memberId)!;

  return (
    <main className="page today-page">
      <section className="hero-brief">
        <div className="brief-copy">
          <p className="eyebrow">Today Brief</p>
          <h2>{focus.label}</h2>
          <p>{focus.explanation}</p>
          <div className="brief-actions">
            <button type="button" onClick={() => onFocusChange('niu')} className={focusId === 'niu' ? 'active' : ''}>牛牛</button>
            <button type="button" onClick={() => onFocusChange('xixi')} className={focusId === 'xixi' ? 'active' : ''}>嘻嘻</button>
          </div>
        </div>
        <div className="score-orbit" style={{ '--accent': focusMember.color, '--score': focus.score } as CSSProperties}>
          <img src={`${import.meta.env.BASE_URL}${focusMember.photo}`} alt="" />
          <strong>{focus.score}</strong>
          <span>/100</span>
        </div>
      </section>

      <section className="brief-grid">
        {daily.map(item => {
          const member = members.find(m => m.id === item.memberId)!;
          return (
            <article className="person-card" key={item.memberId} style={{ '--accent': member.color, '--tint': member.colorBg } as CSSProperties}>
              <div className="person-head">
                <img src={`${import.meta.env.BASE_URL}${member.photo}`} alt="" />
                <div>
                  <h3>{member.name}</h3>
                  <p>{member.wuxing} · 用神{member.yong}</p>
                </div>
                <strong>{item.score}</strong>
              </div>
              <div className="now-strip">
                <span>{item.currentWindow.zhi}时 · {item.currentWindow.gate} · {item.currentWindow.luck}</span>
                <b>{item.currentWindow.advice}</b>
              </div>
              <p className="theme-line">{item.theme.shiShen} · {item.theme.title}</p>
              <div className="mini-list">
                {item.theme.goodFor.slice(0, 3).map(text => <span key={text}>✓ {text}</span>)}
              </div>
            </article>
          );
        })}
      </section>

      <section className="daily-detail-grid">
        {daily.map(item => {
          const member = members.find(m => m.id === item.memberId)!;
          return <DailyDetail key={item.memberId} item={item} member={member} />;
        })}
      </section>

      <details className="panel explain-details">
        <summary>
          <span>为什么这样算</span>
          <b>{focus.factors.length} 个因子</b>
        </summary>
        <div className="factor-list compact">
          {focus.factors.map(factor => (
            <FactorBlock key={factor.id} factor={factor} />
          ))}
        </div>
      </details>
    </main>
  );
}

function DailyDetail({ item, member }: { item: DailyLuckResult; member: MemberProfile }) {
  const [tarotQuestion, setTarotQuestion] = useState('');
  const [drawn, setDrawn] = useState(false);
  const challenge = member.challenges?.[item.score % (member.challenges?.length || 1)];

  return (
    <article className="daily-column panel" style={{ '--accent': member.color, '--tint': member.colorBg } as CSSProperties}>
      <div className="panel-title">
        <p className="eyebrow"><span className="dot" /> 今日全景指引</p>
        <h3>{member.name}</h3>
      </div>

      <section className="strength-zone">
        <h4>今日强弱分区</h4>
        <div className="strength-bars">
          {Object.entries(item.dimensions).map(([label, value]) => (
            <div key={label} className={value >= 60 ? 'strong' : value <= 45 ? 'weak' : 'mid'}>
              <span>{label}</span>
              <div><i style={{ width: `${value}%` }} /></div>
              <b>{value}</b>
            </div>
          ))}
        </div>
        <div className="window-pair">
          <Metric label="当前" value={`${item.currentWindow.range} ${item.currentWindow.gate} · ${item.currentWindow.personalTag}`} />
          <Metric label="下一吉时" value={`${item.nextGoodWindow.range} ${item.nextGoodWindow.gate} · ${item.nextGoodWindow.luck}`} />
        </div>
      </section>

      <section className="guide-card avoid">
        <h4>🚫 今日避坑清单</h4>
        <ul>{item.recommendations.avoidList.slice(0, 3).map(text => <li key={text}>{text}</li>)}</ul>
      </section>

      <section className="guide-card wellness">
        <h4>💪 今日身体作息</h4>
        <KeyValueRows items={item.recommendations.wellness} />
      </section>

      <section className="guide-card helper">
        <h4>👥 今日贵人属相</h4>
        <KeyValueRows items={item.recommendations.helper} />
      </section>

      <section className="guide-card home">
        <h4>🏠 今日居家布局</h4>
        <KeyValueRows items={item.recommendations.home} />
      </section>

      <section className="guide-card speech">
        <h4>🗣 今日说话建议</h4>
        <KeyValueRows items={item.recommendations.speech} />
      </section>

      <TarotBlock item={item} question={tarotQuestion} setQuestion={setTarotQuestion} drawn={drawn} setDrawn={setDrawn} />

      {item.qimen && <QimenPanel chart={item.qimen} />}

      {challenge && (
        <section className="challenge-panel">
          <p className="eyebrow">今日挑战</p>
          <strong>[{challenge.tag}] {challenge.text}</strong>
        </section>
      )}
    </article>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="metric">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function KeyValueRows({ items }: { items: Array<{ label: string; value: string }> }) {
  return (
    <div className="kv-rows">
      {items.map(item => (
        <div key={`${item.label}-${item.value}`}>
          <span>{item.label}</span>
          <strong>{item.value}</strong>
        </div>
      ))}
    </div>
  );
}

function TarotBlock({
  item,
  question,
  setQuestion,
  drawn,
  setDrawn
}: {
  item: DailyLuckResult;
  question: string;
  setQuestion: (value: string) => void;
  drawn: boolean;
  setDrawn: (value: boolean) => void;
}) {
  return (
    <section className="tarot-result">
      <div className="panel-title">
        <p className="eyebrow"><span className="dot" /> 今日塔罗 · 抽牌结果</p>
        <h4>{item.tarot.name} · {item.tarot.reversed ? '逆位' : '正位'} <span className="tarot-arcana-tag">{tarotArcanaLabel(item.tarot.arcana, item.tarot.suit)}</span></h4>
      </div>
      <div className="tarot-layout">
        <div className={`tarot-face ${item.tarot.reversed ? 'reversed' : ''}`}>
          <span className="tarot-no">{String(item.tarot.id).padStart(2, '0')}</span>
          <span className="tarot-emoji">{item.tarot.emoji}</span>
          <strong>{item.tarot.name}</strong>
          <em>{item.tarot.en}</em>
          <b>{item.tarot.reversed ? '逆位' : '正位'}</b>
        </div>
        <div className="tarot-copy">
          <div className="tarot-note">
            <span>牌意内核</span>
            <p>{item.tarot.core}</p>
          </div>
          <p><b>当前含义：</b>{item.tarot.meaning}</p>
          <p><b>建议：</b>{item.tarot.advice}</p>
          <div className="tarot-keywords">
            {item.tarot.keywords.map(keyword => <b key={keyword}>{keyword}</b>)}
          </div>
        </div>
      </div>
      <div className="tarot-ask-row">
        <input value={question} onChange={event => setQuestion(event.target.value)} placeholder={`想问点什么？比如${item.memberId === 'niu' ? '今天适合签合同吗' : '今天适合表白吗'}`} />
        <button type="button" onClick={() => setDrawn(true)}>抽牌</button>
      </div>
      {drawn && (
        <div className="tarot-answer">
          <span>{question || item.tarot.question}</span>
          <strong>{item.tarot.action}</strong>
          <p>这张牌不替你做决定，只给今天的行动角度。</p>
        </div>
      )}
    </section>
  );
}

function QimenPanel({ chart }: { chart: QimenChart }) {
  return (
    <details className="qimen-panel">
      <summary>
        <span><span className="dot" /> 流日方位盘 · 奇门九宫</span>
        <b>值符 {chart.zhiFu || '—'}{chart.solarTerm ? ` · ${chart.solarTerm}` : ''}</b>
      </summary>
      <div className="qimen-grid" role="grid" aria-label="奇门九宫">
        {chart.cells.map((cell, i) => (
          <article
            key={i}
            className={`qimen-cell${cell.isCenter ? ' is-center' : ''}`}
            role="gridcell"
          >
            <header>
              <span className="qm-palace">{cell.palace}</span>
              {cell.gan && <span className="qm-gan">{cell.gan}</span>}
            </header>
            {!cell.isCenter && (
              <>
                <p className="qm-shen">神 · {cell.shen || '—'}</p>
                <p className="qm-men">门 · {cell.men || '—'}</p>
                <p className="qm-star">星 · {cell.star || '—'}</p>
              </>
            )}
            {cell.isCenter && <p className="qm-center-note">中宫寄二 · 仅作参照</p>}
          </article>
        ))}
      </div>
      <p className="muted small">奇门为流派推断层（interpretive），不进入核心分数。点上方收起。</p>
    </details>
  );
}
