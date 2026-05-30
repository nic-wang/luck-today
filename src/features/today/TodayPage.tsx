import type { CSSProperties } from 'react';
import { useState } from 'react';
import { TAROT_RWS_78, type TarotCardData } from '../../data/tarot-rws-78';
import type { QimenChart } from '../../engine/adapters/taobi';
import {
  avoidNarrative,
  nowNarrative,
  supportNarrative,
  themeNarrative,
  type NarrativeRow
} from '../../engine/narrativize';
import type { DailyLuckResult, MemberProfile } from '../../types';

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
      <SectionHeader title="现在" caption="当前时辰能做 / 不能做" />
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
      <SectionHeader title="今日" caption="主题 · 外援 · 避雷" />
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
      <SectionHeader title="心相" caption="心态参考 · 不算分" />
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
      <SectionHeader title="深读" caption="想看推算过程？" />
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
      <article className="narrative-block theme-block">
        <header>
          <h4>今日主题</h4>
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
        polarity="do"
        conclusion={support.conclusion}
        rows={support.rows}
      />
      <NarrativeBlock
        title="今日要避"
        polarity="dont"
        conclusion={avoid.conclusion}
        rows={avoid.rows}
      />
    </div>
  );
}

function NarrativeBlock({
  title,
  conclusion,
  tagline,
  rows,
  polarity
}: {
  title: string;
  conclusion: string;
  tagline?: string;
  rows: NarrativeRow[];
  polarity?: 'do' | 'dont';
}) {
  return (
    <article className={`narrative-block${polarity ? ` polarity-${polarity}` : ''}`}>
      <header>
        <h4>{title}</h4>
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
  // 当前展示的牌：默认 = engine 算的命定牌；用户抽牌后 = 互动结果
  const [drawnCard, setDrawnCard] = useState<{ card: TarotCardData; reversed: boolean } | null>(null);
  const [drawnFromQuestion, setDrawnFromQuestion] = useState('');

  // 实际渲染用的牌
  const tarot = drawnCard
    ? {
        ...drawnCard.card,
        reversed: drawnCard.reversed,
        meaning: drawnCard.reversed ? drawnCard.card.reversed : drawnCard.card.upright,
        question: drawnFromQuestion || `今天我应该如何处理"${drawnCard.card.name}"的命题？`
      }
    : item.tarot;

  function reroll() {
    // 真随机：用 Date.now() + question 文本 + member 做种子
    const seedText = `${Date.now()}-${question}-${member.id}`;
    const seed = hashString(seedText);
    const idx = seed % TAROT_RWS_78.length;
    const card = TAROT_RWS_78[idx];
    const reversed = ((seed >> 8) & 1) === 1;
    setDrawnCard({ card, reversed });
    setDrawnFromQuestion(question);
  }

  function reset() {
    setDrawnCard(null);
    setDrawnFromQuestion('');
    setQuestion('');
  }

  return (
    <article className="ritual-card">
      <header>
        <h4>今日心相</h4>
        <span className="tier-chip" data-tier="ritual">心相 · 不算分</span>
      </header>

      <div className="ritual-body">
        <div className={`ritual-face ${tarot.reversed ? 'reversed' : ''}`}>
          <img
            className="ritual-img"
            src={`${import.meta.env.BASE_URL}assets/tarot/${String(tarot.id).padStart(3, '0')}.jpg`}
            alt={tarot.name}
            loading="lazy"
          />
          <div className="ritual-face-meta">
            <span className="card-no">{String(tarot.id).padStart(2, '0')}</span>
            <strong>{tarot.name}</strong>
            <em>{tarot.en}</em>
            <b>{tarot.reversed ? '逆位' : '正位'} · {tarotArcanaLabel(tarot.arcana, tarot.suit)}</b>
          </div>
        </div>

        {/* 5 段框架：原版含义 / 今日解读 / 行动建议 / 白话 / 关键词 */}
        <div className="ritual-text">
          <RitualSection label="原版含义" body={tarot.core} />
          <RitualSection label="今日解读" body={tarot.meaning} />
          <RitualSection label="行动建议" body={tarot.action} />
          <RitualSection label="白话" body={tarot.advice} />
          <div className="ritual-keywords">
            <span className="ritual-section-label">关键词</span>
            <div className="keywords">
              {tarot.keywords.map(k => <span key={k}>{k}</span>)}
            </div>
          </div>
        </div>
      </div>

      <div className="ritual-ask">
        <input
          value={question}
          onChange={e => setQuestion(e.target.value)}
          placeholder={`想问点什么？比如${member.id === 'niu' ? '今天适合签合同吗' : '今天适合表白吗'}`}
        />
        <button type="button" onClick={reroll}>{drawnCard ? '再抽一张' : '抽牌'}</button>
        {drawnCard && (
          <button type="button" className="ritual-reset" onClick={reset}>回默认</button>
        )}
      </div>

      {drawnCard && (
        <p className="ritual-note muted small">
          自由抽 · 牌随每次问题/时刻变化 · 命定牌（默认）由日干 + 出生信息决定
        </p>
      )}
    </article>
  );
}

function RitualSection({ label, body }: { label: string; body: string }) {
  return (
    <div className="ritual-section">
      <span className="ritual-section-label">{label}</span>
      <p>{body}</p>
    </div>
  );
}

// 字符串 → 32 bit 哈希（不引依赖）
function hashString(s: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h;
}

function DeepReadBody({ item }: { item: DailyLuckResult }) {
  return (
    <div className="deep-body">
      <p className="muted small">算法因子追溯请到「解释」Tab · 这里只看推算盘面</p>

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
