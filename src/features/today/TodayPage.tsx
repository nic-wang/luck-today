import type { CSSProperties } from 'react';
import { useState } from 'react';
import type { QimenChart } from '../../engine/adapters/taobi';
import {
  avoidNarrative,
  nowNarrative,
  supportNarrative,
  themeNarrative,
  type NarrativeRow
} from '../../engine/narrativize';
import type { AlgorithmFactor, DailyLuckResult, LuckTier, MemberProfile } from '../../types';

const TIER_LABEL: Record<LuckTier, string> = {
  deterministic: '确定层',
  interpretive: '解释层',
  ritual: '仪式层'
};

const SUIT_LABEL: Record<NonNullable<DailyLuckResult['tarot']['suit']>, string> = {
  wands: '权杖 · 火',
  cups: '圣杯 · 水',
  swords: '宝剑 · 风',
  pentacles: '钱币 · 土'
};

interface Props {
  daily: DailyLuckResult[];
  focusId: string;
  onFocusChange: (id: string) => void;
  members: MemberProfile[];
}

export function TodayPage({ daily, focusId, onFocusChange, members }: Props) {
  return (
    <main className="page today-page">
      <HeroCompact daily={daily} focusId={focusId} onFocusChange={onFocusChange} members={members} />
      <DualSegments daily={daily} focusId={focusId} members={members} />
    </main>
  );
}

function HeroCompact({
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
  const ordered = [...daily].sort((a, b) => {
    if (a.memberId === focusId) return -1;
    if (b.memberId === focusId) return 1;
    return 0;
  });
  return (
    <section className="hero-compact">
      <div className="hero-row">
        {ordered.map(item => {
          const m = members.find(x => x.id === item.memberId)!;
          const active = item.memberId === focusId;
          return (
            <button
              key={item.memberId}
              type="button"
              className={`hero-person${active ? ' is-active' : ''}`}
              onClick={() => onFocusChange(item.memberId)}
              style={{ '--accent': m.color } as CSSProperties}
            >
              <img src={`${import.meta.env.BASE_URL}${m.photo}`} alt="" />
              <div>
                <p className="name">{m.name}</p>
                <p className="meta">{m.wuxing} · 用神{m.yong}</p>
              </div>
              <strong>{item.score}</strong>
              <em>{item.label}</em>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function DualSegments({
  daily,
  focusId,
  members
}: {
  daily: DailyLuckResult[];
  focusId: string;
  members: MemberProfile[];
}) {
  // 把 focused 那个人排在第一位（视觉主位）
  const ordered = [...daily].sort((a, b) => {
    if (a.memberId === focusId) return -1;
    if (b.memberId === focusId) return 1;
    return 0;
  });

  return (
    <div className="day-stack">

      {/* 段 1 · 现在 */}
      <SectionHeader title="现在" caption="实时层 · 当前时辰能做什么" />
      <PersonRow>
        {ordered.map(item => {
          const m = members.find(x => x.id === item.memberId)!;
          return (
            <PersonColumn key={item.memberId} member={m} isFocused={item.memberId === focusId}>
              <NowCard item={item} />
            </PersonColumn>
          );
        })}
      </PersonRow>

      {/* 段 2 · 今日 */}
      <SectionHeader title="今日" caption="解释层 · 主题 / 外援 / 避雷" />
      <PersonRow>
        {ordered.map(item => {
          const m = members.find(x => x.id === item.memberId)!;
          return (
            <PersonColumn key={item.memberId} member={m} isFocused={item.memberId === focusId}>
              <TodayBlocks item={item} member={m} />
            </PersonColumn>
          );
        })}
      </PersonRow>

      {/* 段 3 · 仪式 */}
      <SectionHeader title="仪式" caption="仪式层 · 不影响分数 · 看心态参考" />
      <PersonRow>
        {ordered.map(item => {
          const m = members.find(x => x.id === item.memberId)!;
          return (
            <PersonColumn key={item.memberId} member={m} isFocused={item.memberId === focusId}>
              <RitualCard item={item} member={m} />
            </PersonColumn>
          );
        })}
      </PersonRow>

      {/* 段 4 · 深读（折叠） */}
      <SectionHeader title="深读" caption="折叠 · 给想看推算过程的人" />
      <details className="deep-read">
        <summary>
          <span>展开算法因子 + 奇门盘 + 时辰盘</span>
          <b>双人对照</b>
        </summary>
        <PersonRow>
          {ordered.map(item => {
            const m = members.find(x => x.id === item.memberId)!;
            return (
              <PersonColumn key={item.memberId} member={m} isFocused={item.memberId === focusId}>
                <DeepReadBody item={item} />
              </PersonColumn>
            );
          })}
        </PersonRow>
      </details>
    </div>
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

function PersonRow({ children }: { children: React.ReactNode }) {
  return <div className="person-row">{children}</div>;
}

function PersonColumn({
  member,
  isFocused,
  children
}: {
  member: MemberProfile;
  isFocused: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`person-col${isFocused ? ' is-focused' : ' is-dimmed'}`}
      style={{ '--accent': member.color, '--tint': member.colorBg } as CSSProperties}
    >
      <header className="col-head">
        <img src={`${import.meta.env.BASE_URL}${member.photo}`} alt="" />
        <span>{member.name}</span>
        {!isFocused && <em>对照</em>}
      </header>
      <div className="col-body">{children}</div>
    </div>
  );
}

function NowCard({ item }: { item: DailyLuckResult }) {
  const now = nowNarrative(item);
  const next = item.nextGoodWindow;
  return (
    <article className="now-card">
      <div className="now-headline">
        <p className="eyebrow">{now.sub}</p>
        <strong className="now-do"><span className="polarity polarity-do">必做</span>{now.conclusion}</strong>
        <p className="now-donot"><span className="polarity polarity-dont">不做</span>{now.donot}</p>
      </div>
      <div className="now-meta">
        <span>下一吉时</span>
        <b>{next.range} · {next.gate}</b>
      </div>
    </article>
  );
}

function TodayBlocks({ item, member }: { item: DailyLuckResult; member: MemberProfile }) {
  const theme = themeNarrative(item);
  const support = supportNarrative(item);
  const avoid = avoidNarrative(item, member);
  return (
    <div className="today-blocks">
      <article className="narrative-block tier-interpretive theme-block">
        <header>
          <h4>今日主题</h4>
          <span className="tier-chip" data-tier="interpretive">{TIER_LABEL.interpretive}</span>
        </header>
        <p className="conclusion"><strong>{theme.conclusion}</strong></p>
        <p className="tagline">{theme.tagline}</p>
        <div className="polarity-grid">
          <div className="polarity-col polarity-do">
            <span className="polarity-label">必做</span>
            <ul>
              {item.theme.goodFor.slice(0, 3).map(t => <li key={t}>{t}</li>)}
            </ul>
          </div>
          <div className="polarity-col polarity-dont">
            <span className="polarity-label">不做</span>
            <ul>
              {item.theme.watchOut.slice(0, 3).map(t => <li key={t}>{t}</li>)}
            </ul>
          </div>
        </div>
      </article>
      <NarrativeBlock
        title="今日外援"
        tier="interpretive"
        polarity="do"
        conclusion={support.conclusion}
        rows={support.rows}
      />
      <NarrativeBlock
        title="今日要避"
        tier="interpretive"
        polarity="dont"
        conclusion={avoid.conclusion}
        rows={avoid.rows}
      />
    </div>
  );
}

function NarrativeBlock({
  title,
  tier,
  conclusion,
  tagline,
  rows,
  polarity
}: {
  title: string;
  tier: LuckTier;
  conclusion: string;
  tagline?: string;
  rows: NarrativeRow[];
  polarity?: 'do' | 'dont';
}) {
  return (
    <article className={`narrative-block tier-${tier}${polarity ? ` polarity-${polarity}` : ''}`}>
      <header>
        <h4>{title}</h4>
        <span className="tier-chip" data-tier={tier}>{TIER_LABEL[tier]}</span>
      </header>
      <p className="conclusion"><strong>{conclusion}</strong></p>
      {tagline && <p className="tagline">{tagline}</p>}
      <ul className="support-rows">
        {rows.map((row, i) => (
          <li key={i}>
            <span className="row-icon" aria-hidden="true">{row.icon}</span>
            <div>
              <b>{row.label}</b>
              {row.detail && <em>{row.detail}</em>}
            </div>
          </li>
        ))}
      </ul>
    </article>
  );
}

function RitualCard({ item, member }: { item: DailyLuckResult; member: MemberProfile }) {
  const [question, setQuestion] = useState('');
  const [drawn, setDrawn] = useState(false);
  return (
    <article className="ritual-card">
      <header>
        <h4>今日心态提示</h4>
        <span className="tier-chip" data-tier="ritual">仪式层 · 不进核心分数</span>
      </header>
      <div className="ritual-body">
        <div className={`ritual-face ${item.tarot.reversed ? 'reversed' : ''}`}>
          <span className="card-no">{String(item.tarot.id).padStart(2, '0')}</span>
          <span className="card-emoji">{item.tarot.emoji}</span>
          <strong>{item.tarot.name}</strong>
          <em>{item.tarot.en}</em>
          <b>{item.tarot.reversed ? '逆位' : '正位'} · {tarotArcanaLabel(item.tarot.arcana, item.tarot.suit)}</b>
        </div>
        <div className="ritual-text">
          <p className="conclusion"><strong>{item.tarot.core}</strong></p>
          <p><b>解读：</b>{item.tarot.meaning}</p>
          <p><b>动作：</b>{item.tarot.action}</p>
          <div className="keywords">
            {item.tarot.keywords.map(k => <span key={k}>{k}</span>)}
          </div>
        </div>
      </div>
      <div className="ritual-ask">
        <input
          value={question}
          onChange={e => setQuestion(e.target.value)}
          placeholder={`想问点什么？比如${member.id === 'niu' ? '今天适合签合同吗' : '今天适合表白吗'}`}
        />
        <button type="button" onClick={() => setDrawn(true)}>抽牌</button>
      </div>
      {drawn && (
        <div className="ritual-answer">
          <span>{question || item.tarot.question}</span>
          <strong>{item.tarot.action}</strong>
          <p>这张牌不替你做决定 · 只给一个看待今天的角度。</p>
        </div>
      )}
    </article>
  );
}

function DeepReadBody({ item }: { item: DailyLuckResult }) {
  return (
    <div className="deep-body">
      <section>
        <h5>算法因子</h5>
        <p className="muted small">每条带 trustLevel + 权重点（5 点 = 满权重）</p>
        <div className="factor-list">
          {item.factors.map(f => <FactorBlock key={f.id} factor={f} />)}
        </div>
      </section>

      {item.qimen && (
        <section>
          <h5>流日方位盘 · 奇门九宫</h5>
          <p className="muted small">值符 {item.qimen.zhiFu || '—'}{item.qimen.solarTerm ? ` · ${item.qimen.solarTerm}` : ''}</p>
          <QimenGrid chart={item.qimen} />
        </section>
      )}

      <section>
        <h5>当前 / 下一吉时</h5>
        <HourBar item={item} />
      </section>
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

function QimenGrid({ chart }: { chart: QimenChart }) {
  return (
    <div className="qimen-grid" role="grid">
      {chart.cells.map((cell, i) => (
        <article key={i} className={`qimen-cell${cell.isCenter ? ' is-center' : ''}`} role="gridcell">
          <header>
            <span className="qm-palace">{cell.palace}</span>
            {cell.gan && <span className="qm-gan">{cell.gan}</span>}
          </header>
          {!cell.isCenter ? (
            <>
              <p className="qm-shen">神 · {cell.shen || '—'}</p>
              <p className="qm-men">门 · {cell.men || '—'}</p>
              <p className="qm-star">星 · {cell.star || '—'}</p>
            </>
          ) : (
            <p className="qm-center-note">中宫寄二</p>
          )}
        </article>
      ))}
    </div>
  );
}

function HourBar({ item }: { item: DailyLuckResult }) {
  return (
    <div className="hour-bar">
      <div className="hour-cell is-current">
        <span>当前 · {item.currentWindow.zhi}时</span>
        <strong>{item.currentWindow.gate}</strong>
        <em>{item.currentWindow.luck}</em>
      </div>
      <div className="hour-cell">
        <span>下一吉时 · {item.nextGoodWindow.zhi}时</span>
        <strong>{item.nextGoodWindow.gate}</strong>
        <em>{item.nextGoodWindow.luck}</em>
      </div>
    </div>
  );
}

function tarotArcanaLabel(
  arcana: DailyLuckResult['tarot']['arcana'],
  suit: DailyLuckResult['tarot']['suit']
): string {
  if (arcana === 'major') return '大阿尔卡纳';
  if (arcana === 'minor' && suit) return `小阿尔卡纳 · ${SUIT_LABEL[suit]}`;
  return '';
}
