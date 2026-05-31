import type { CSSProperties } from 'react';
import { useState } from 'react';
import { TAROT_RWS_78, type TarotCardData } from '../../data/tarot-rws-78';
import type { QimenChart } from '../../engine/adapters/taobi';
import {
  avoidImpactPcts,
  avoidNarrative,
  concreteFor,
  nowNarrative,
  SCORE_TIERS,
  supportImpactPcts,
  supportNarrative,
  themeImpactPcts,
  themeNarrative,
  tierContext
} from '../../engine/narrativize';
import { buildFollowUp, buildQuestionFusion, type FollowUpAnswer } from '../../engine/tarot-fusion';
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

export function TodayPage({ daily, focusId, members }: Props) {
  // 单人视角 · 只渲染 focusId 那一份
  const item = daily.find(d => d.memberId === focusId) ?? daily[0];
  const member = members.find(m => m.id === item.memberId)!;
  return (
    <main className="page today-page">
      <SoloHero item={item} member={member} />
      <SoloStack item={item} member={member} />
    </main>
  );
}

function SoloHero({ item, member }: { item: DailyLuckResult; member: MemberProfile }) {
  return <ScoreHero item={item} member={member} />;
}

const LUCK_TO_HEIGHT: Record<string, number> = {
  大吉: 0.95,
  吉: 0.78,
  中: 0.55,
  凶: 0.32,
  大凶: 0.18
};

function ScoreHero({ item, member }: { item: DailyLuckResult; member: MemberProfile }) {
  const ctx = tierContext(item.score);
  const score = item.score;
  const accent = member.color;
  const stops = makeAccentStops(accent);

  // 12 时辰柱状图数据
  const hours = item.hours ?? [];
  const currentZhi = item.currentWindow.zhi;
  const nextZhi = item.nextGoodWindow.zhi;

  return (
    <section className="score-hero" style={{ '--accent': accent, '--c1': stops[0], '--c2': stops[1], '--c3': stops[2] } as CSSProperties}>
      {/* 顶部 eyebrow · 头像 / 副标 / tier chip */}
      <div className="hero-eyebrow-row">
        <div className="hero-mini-avatar" style={member.photo ? undefined : { background: member.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {member.photo
            ? <img src={`${import.meta.env.BASE_URL}${member.photo}`} alt="" />
            : <span style={{ fontSize: 22 }}>{(member as { _emoji?: string })._emoji ?? '👤'}</span>
          }
        </div>
        <div className="hero-eyebrow-text">
          <span className="hero-eyebrow-label">{member.name} · TODAY SCORE</span>
          <span className="hero-eyebrow-sub">{item.lunar} · {item.ganzhi}</span>
        </div>
        <span className="hero-tier-pill">{ctx.tier.label}</span>
      </div>

      {/* 大数字 + 单位 · 渐变字 */}
      <div className="hero-num-row">
        <strong className="hero-num">{score}</strong>
        <span className="hero-num-unit">/ 100</span>
        {ctx.toNext !== null && (
          <span className="hero-num-next">距「{nextTierLabel(ctx.tier.min)}」{ctx.toNext} 分</span>
        )}
      </div>

      {/* 12 时辰能量柱状图 · 横向坐标 · 当前/下一吉时高亮 */}
      <div className="hero-bars-section">
        <div className="hero-bars-head">
          <span className="hero-bars-eyebrow">HOUR ENERGY · 今日 12 时辰能量分布</span>
          <span className="hero-bars-legend">
            <i className="lg-dot lg-current" /> 现在
            <i className="lg-dot lg-next" /> 下一吉时
          </span>
        </div>

        <div className="hero-bars" role="img" aria-label="12 时辰能量分布柱状图">
          {hours.length > 0 ? hours.map((w, i) => {
            const h = LUCK_TO_HEIGHT[w.luck] ?? 0.5;
            const isCurrent = w.zhi === currentZhi;
            const isNextGood = w.zhi === nextZhi && !isCurrent;
            return (
              <div
                key={i}
                className={`hour-col${isCurrent ? ' is-current' : ''}${isNextGood ? ' is-next' : ''}`}
                title={`${w.zhi}时 · ${w.range} · ${w.gate} · ${w.luck}`}
              >
                <span className="hour-bar-shape" style={{ height: `${h * 100}%` }}>
                  {isCurrent && <i className="bar-tick" />}
                </span>
                <span className="hour-zhi">{w.zhi}</span>
              </div>
            );
          }) : null}
        </div>

        <p className="hero-bars-foot">
          柱高 = 该时辰对你的能量强度（大吉&gt;吉&gt;中&gt;凶&gt;大凶）· 点击对照「深读」可看完整 12 时辰盘
        </p>
      </div>

      {/* NOW / NEXT 重点信息 · 给出明确的"做什么" */}
      <div className="hero-foot">
        <div className="hero-foot-now">
          <span className="hf-label">NOW · 当前能做</span>
          <span className="hf-value">{currentZhi}时 · {item.currentWindow.gate}</span>
          <span className="hf-advice">{item.currentWindow.advice}</span>
        </div>
        <div className="hero-foot-next">
          <span className="hf-label">NEXT · 下一吉时</span>
          <span className="hf-value">{nextZhi}时 · {item.nextGoodWindow.gate}</span>
          <span className="hf-advice">{item.nextGoodWindow.range} · {item.nextGoodWindow.advice}</span>
        </div>
      </div>
    </section>
  );
}

// 单色系渐变 stops · 基于 accent 衍生（深 / 中 / 浅）
function makeAccentStops(accent: string): [string, string, string] {
  return [
    accent,
    mixHex(accent, '#ffffff', 0.35),
    mixHex(accent, '#ffffff', 0.62)
  ];
}

function mixHex(a: string, b: string, ratio: number): string {
  const pa = parseHex(a);
  const pb = parseHex(b);
  const r = Math.round(pa[0] * (1 - ratio) + pb[0] * ratio);
  const g = Math.round(pa[1] * (1 - ratio) + pb[1] * ratio);
  const bl = Math.round(pa[2] * (1 - ratio) + pb[2] * ratio);
  return `#${[r, g, bl].map(v => v.toString(16).padStart(2, '0')).join('')}`;
}

function parseHex(h: string): [number, number, number] {
  const s = h.replace('#', '');
  const v = s.length === 3
    ? s.split('').map(c => parseInt(c + c, 16))
    : [parseInt(s.slice(0, 2), 16), parseInt(s.slice(2, 4), 16), parseInt(s.slice(4, 6), 16)];
  return [v[0], v[1], v[2]];
}

function nextTierLabel(currentMin: number): string {
  const idx = SCORE_TIERS.findIndex(t => t.min === currentMin);
  return idx > 0 ? SCORE_TIERS[idx - 1].label : '';
}

function SoloStack({ item, member }: { item: DailyLuckResult; member: MemberProfile }) {
  return (
    <div className="day-stack">

      {/* 段 1 · 现在 */}
      <SectionHeader title="现在" caption="当前时辰能做 / 不能做" tone="now" />
      <NowCard item={item} />

      {/* 段 2 · 今日 */}
      <SectionHeader title="今日" caption="今日主题 · 贵人 · 闪避" tone="today" />
      <TodayBlocks item={item} member={member} />

      {/* 段 3 · 仪式 */}
      <SectionHeader title="塔罗" caption="心态参考 · 不算分" tone="ritual" />
      <RitualCard item={item} member={member} />

      {/* 段 4 · 深读（折叠） */}
      <SectionHeader title="深读" caption="想看推算过程？" tone="deep" />
      <details className="deep-read">
        <summary>
          <span>展开奇门盘 + 时辰盘</span>
          <b>{member.name} 单人视角</b>
        </summary>
        <DeepReadBody item={item} />
      </details>
    </div>
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
  const support = supportNarrative(item, member);
  const avoid = avoidNarrative(item, member);

  const goodFor = item.theme.goodFor.slice(0, 3);
  const watchOut = item.theme.watchOut.slice(0, 3);
  const goodNotes = concreteFor(member.id, goodFor);
  const avoidNotes = concreteFor(member.id, watchOut);

  const goodPcts = themeImpactPcts(item, true, goodFor.length);
  const avoidPcts = themeImpactPcts(item, false, watchOut.length);
  const supportPcts = supportImpactPcts(item);
  const avoidRowPcts = avoidImpactPcts(item, avoid.rows.length);

  return (
    <div className="today-blocks">
      <article className="narrative-block theme-block">
        <header>
          <h4>今日主题</h4>
          <span className="theme-badge">{theme.tagline}</span>
        </header>
        <p className="conclusion"><strong>{themePlain(theme.conclusion, item.theme.shiShen)}</strong></p>

        <div className="impact-mosaic">
          <div className="mosaic-section mosaic-do">
            <div className="mosaic-section-head">
              <span className="ms-label">必做 · 今日推进力分布</span>
              <span className="ms-sum">100<i>%</i></span>
            </div>
            <div className="mosaic-grid">
              {goodFor.map((t, i) => (
                <ImpactCard
                  key={t}
                  rank={i}
                  impact={goodPcts[i]}
                  polarity="do"
                  label={t}
                  note={goodNotes[i]}
                />
              ))}
            </div>
            <p className="mosaic-foot">3 件事按重要度切分推进力 · 数字越大 = 今天权重越高</p>
          </div>

          <div className="mosaic-section mosaic-dont">
            <div className="mosaic-section-head">
              <span className="ms-label">不做 · 今日扣分风险分布</span>
              <span className="ms-sum">100<i>%</i></span>
            </div>
            <div className="mosaic-grid">
              {watchOut.map((t, i) => (
                <ImpactCard
                  key={t}
                  rank={i}
                  impact={avoidPcts[i]}
                  polarity="dont"
                  label={t}
                  note={avoidNotes[i]}
                />
              ))}
            </div>
            <p className="mosaic-foot">3 个雷按风险度切分扣分概率 · 数字越大 = 越优先避开</p>
          </div>
        </div>
      </article>

      {/* 今日贵人 · 横条 progress 模板 · 100% 分拆 */}
      <article className="narrative-block polarity-do">
        <header>
          <h4>今日贵人</h4>
          <span className="block-sum-100">100<i>%</i></span>
        </header>
        <p className="conclusion"><strong>{support.conclusion}</strong></p>
        <p className="block-eyebrow">HELPER PROGRESS · 今天能借的贵人之力</p>
        <div className="progress-list">
          {support.rows.map((row, i) => (
            <ProgressRow
              key={i}
              icon={row.icon}
              label={row.label}
              detail={row.detail}
              note={row.note}
              impact={supportPcts[i]}
              polarity="do"
            />
          ))}
        </div>
      </article>

      {/* 今日闪避 · 横条 progress 模板 · 100% 分拆 */}
      <article className="narrative-block polarity-dont">
        <header>
          <h4>今日闪避</h4>
          <span className="block-sum-100">100<i>%</i></span>
        </header>
        <p className="conclusion"><strong>{avoid.conclusion}</strong></p>
        <p className="block-eyebrow">DODGE PROGRESS · 今天要闪避的雷区</p>
        <div className="progress-list">
          {avoid.rows.map((row, i) => (
            <ProgressRow
              key={i}
              icon={row.icon}
              label={row.label}
              detail={row.detail}
              note={row.note}
              impact={avoidRowPcts[i] ?? 33}
              polarity="dont"
            />
          ))}
        </div>
      </article>
    </div>
  );
}

function ProgressRow({
  icon,
  label,
  detail,
  note,
  impact,
  polarity
}: {
  icon: string;
  label: string;
  detail?: string;
  note?: string;
  impact: number;
  polarity: 'do' | 'dont';
}) {
  const sign = polarity === 'do' ? '+' : '-';
  const dotPos = Math.min(96, Math.max(4, impact));
  return (
    <article className={`progress-row progress-${polarity}`}>
      <header className="pr-head">
        <span className="pr-icon" aria-hidden="true">{icon}</span>
        <p className="pr-label">{label}</p>
      </header>
      <div className="pr-meter">
        <span className="pr-num">
          <i className="pr-sign">{sign}</i>
          <strong>{impact}</strong>
          <i className="pr-unit">%</i>
        </span>
        <div className="pr-bar-wrap">
          <div className="pr-bar">
            <span className="pr-bar-fill" style={{ width: `${impact}%` }} />
            <span className="pr-bar-dot" style={{ left: `${dotPos}%` }} />
          </div>
          <span className="pr-bar-end" aria-hidden="true" />
        </div>
      </div>
      {detail && <p className="pr-detail">{detail}</p>}
      {note && <p className="pr-note">{note}</p>}
    </article>
  );
}

// 把"比肩主题"等术语翻成白话 · 不出现"食神/比肩"等术语
function themePlain(_tone: string, shiShen: string): string {
  const plain: Record<string, string> = {
    比肩: '今天靠协作出活 · 找同频伙伴一起推进 · 不一个人扛',
    劫财: '今天能量足 · 适合行动但要克制冲动 · 别临时加码承诺',
    食神: '今天适合做让自己开心的事 · 把想法真做出来',
    伤官: '今天表达欲强 · 适合展示但要看场合',
    偏财: '今天财气在流动 · 适合谈合作 / 拓人脉',
    正财: '今天踏实做事的一天 · 把活做实 · 不冒进',
    七杀: '今天压力大 · 适合啃硬骨头 · 注意身体',
    正官: '今天走规矩 · 适合正式场合 / 流程',
    偏印: '今天适合一个人钻研 · 选偏冷门视角',
    正印: '今天适合学习吸收 · 接受指导'
  };
  return plain[shiShen] ?? _tone;
}

function ImpactCard({
  rank,
  impact,
  polarity,
  label,
  note,
  detail
}: {
  rank: number;
  impact: number;
  polarity: 'do' | 'dont';
  label: string;
  note?: string;
  detail?: string;
}) {
  const sign = polarity === 'do' ? '+' : '-';
  return (
    <article className={`impact-card impact-${polarity} impact-rank-${rank}`}>
      <div className="impact-num">
        <span className="impact-sign">{sign}</span>
        <span className="impact-val">{impact}</span>
        <i className="impact-unit">%</i>
      </div>
      <div className="impact-bar" aria-hidden="true">
        <span className="impact-bar-fill" style={{ width: `${Math.min(100, impact)}%` }} />
      </div>
      <p className="impact-label">{label}</p>
      {detail && <p className="impact-detail">{detail}</p>}
      {note && <p className="impact-note">{note}</p>}
    </article>
  );
}

function RitualCard({ item, member }: { item: DailyLuckResult; member: MemberProfile }) {
  const [question, setQuestion] = useState('');
  // 当前展示的牌：默认 = engine 算的命定牌；用户抽牌后 = 互动结果
  const [drawnCard, setDrawnCard] = useState<{ card: TarotCardData; reversed: boolean } | null>(null);
  const [drawnFromQuestion, setDrawnFromQuestion] = useState('');

  // 追问 state
  const [followUpDraft, setFollowUpDraft] = useState('');
  const [followUpHistory, setFollowUpHistory] = useState<Array<{ q: string; answer: FollowUpAnswer }>>([]);

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
    // 抽新牌时清空追问历史（牌都换了 · 之前的追问失效）
    setFollowUpHistory([]);
    setFollowUpDraft('');
  }

  function reset() {
    setDrawnCard(null);
    setDrawnFromQuestion('');
    setQuestion('');
    setFollowUpHistory([]);
    setFollowUpDraft('');
  }

  function submitFollowUp() {
    if (!drawnCard || !followUpDraft.trim()) return;
    const answer = buildFollowUp(drawnCard.card, drawnCard.reversed, drawnFromQuestion, followUpDraft);
    setFollowUpHistory(h => [...h, { q: followUpDraft, answer }]);
    setFollowUpDraft('');
  }

  // 抽牌后 · 问题 × 牌融合（按完整 TarotCardData + reversed 输入 · 走专门 engine）
  const fusion = drawnCard && drawnFromQuestion
    ? buildQuestionFusion(drawnFromQuestion, drawnCard.card, drawnCard.reversed)
    : null;

  return (
    <article className="ritual-card">
      <header>
        <h4>今日塔罗</h4>
        <span className="tier-chip" data-tier="ritual">塔罗 · 不算分</span>
      </header>

      {/* 顶部：左 figure + 右 摘要/融合（保持等高 · 不留白） */}
      <div className="ritual-top">
        <figure className={`ritual-face ${tarot.reversed ? 'reversed' : ''}`}>
          <figcaption className="ritual-face-meta">
            <span className="card-no">No. {String(tarot.id).padStart(2, '0')}</span>
            <strong>{tarot.name}</strong>
            <em>{tarot.en}</em>
            <b>{tarot.reversed ? '逆位' : '正位'} · {tarotArcanaLabel(tarot.arcana, tarot.suit)}</b>
          </figcaption>
          <img
            className="ritual-img"
            src={`${import.meta.env.BASE_URL}assets/tarot/${String(tarot.id).padStart(3, '0')}.jpg`}
            alt={tarot.name}
            loading="lazy"
          />
        </figure>

        {fusion ? (
          <section className={`ritual-side ritual-fusion fusion-tone-${fusion.tone}`}>
            {/* 标准 header · 对齐 narrative-block：h4 + tier-chip */}
            <header className="fusion-head">
              <h4>针对你的问题</h4>
              <span className="tier-chip" data-tier="ritual">{fusion.angle}</span>
            </header>

            {/* 用户问句 · 引文 · 弱化 */}
            <p className="fusion-q">「{fusion.question}」</p>

            {/* 主结论 · 用 .conclusion 标准类（15px / strong 渐变 · tone 决定渐变色）*/}
            <p className="conclusion"><strong>{fusion.verdict}</strong></p>

            {/* 副注 · block-eyebrow 标签 + reasoning body · 对齐主站三段式 */}
            <p className="block-eyebrow">牌面解读</p>
            <p className="fusion-reasoning">{fusion.reasoning}</p>

            {/* action 用 support-rows 标准结构 */}
            <ul className="support-rows fusion-action-rows">
              <li>
                <span className="row-icon">▎</span>
                <div>
                  <b>{fusion.actionLabel}</b>
                  <em>{fusion.action}</em>
                </div>
              </li>
            </ul>

            <details className="fusion-deep">
              <summary>展开进阶解读 · 牌的能量框架</summary>
              <p className="fusion-restatement">{fusion.restatement}</p>
              <p className="fusion-insight"><b>{tarot.name}{tarot.reversed ? ' 逆位' : ' 正位'}：</b>{fusion.insight}</p>
              <p className="fusion-landing"><b>落到能量层：</b>{fusion.landing}</p>
            </details>
          </section>
        ) : (
          <section className="ritual-side ritual-default">
            <div className="side-head">
              <span className="ritual-section-label">本日命定</span>
              <p className="default-line">由日干 + 出生信息决定 · 想换张就在下方输入问题</p>
            </div>
            <div className="side-mid">
              <p className="default-quote">"{tarot.core}"</p>
              <div className="default-kw">
                {tarot.keywords.map(k => <span key={k}>{k}</span>)}
              </div>
              <p className="default-action"><b>动作：</b>{tarot.action}</p>
            </div>
            <p className="side-foot">塔罗 = 心态参考 · 不进入今日得分</p>
          </section>
        )}
      </div>

      {/* 追问区 · 仅抽牌后显示 · 不重抽 · 用同一张牌做聚焦回答 */}
      {fusion && (
        <section className="ritual-followup">
          <header className="followup-head">
            <span className="ritual-section-label">追问 · 不清楚就再问一句</span>
            <span className="muted small">不换牌 · 用同一张牌给更聚焦的回答</span>
          </header>

          {followUpHistory.length > 0 && (
            <div className="followup-history">
              {followUpHistory.map((h, i) => (
                <article key={i} className={`followup-bubble fu-${h.answer.kind}`}>
                  <p className="fu-q">「{h.q}」</p>
                  {h.answer.bridge && <p className="fu-bridge muted small">{h.answer.bridge}</p>}
                  <p className="fu-reading">{h.answer.reading}</p>
                  <p className="fu-next"><b>具体一步：</b>{h.answer.next}</p>
                  {h.answer.caveat && <p className="fu-caveat muted small">{h.answer.caveat}</p>}
                </article>
              ))}
            </div>
          )}

          <div className="followup-ask">
            <input
              value={followUpDraft}
              onChange={e => setFollowUpDraft(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') submitFollowUp(); }}
              placeholder='追问 · 比如"但是我必须今天签" / "那大概什么时候" / "具体怎么做"'
            />
            <button type="button" onClick={submitFollowUp} disabled={!followUpDraft.trim()}>
              {followUpHistory.length > 0 ? '再追问' : '追问'}
            </button>
          </div>
        </section>
      )}

      {/* 置底 strip：5 段释义（折叠 · 默认收起 · 想看再展开） */}
      <details className="ritual-strip">
        <summary>
          <span>展开 5 段释义</span>
          <b>原版含义 / 今日解读 / 行动建议 / 白话 / 关键词</b>
        </summary>
        <div className="ritual-text">
          <RitualSection label="原版含义" body={tarot.core} />
          <RitualSection label="今日解读" body={tarot.meaning} />
          <RitualSection label="行动建议" body={tarot.action} />
          <RitualSection label="白话" body={tarot.advice} />
          <div className="ritual-row">
            <span className="ritual-section-label">关键词</span>
            <div className="keywords">
              {tarot.keywords.map(k => <span key={k}>{k}</span>)}
            </div>
          </div>
        </div>
      </details>

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
          自由抽 · 牌随问题 / 时刻变化 · 命定牌（默认）由日干 + 出生信息决定
        </p>
      )}
    </article>
  );
}

function RitualSection({ label, body }: { label: string; body: string }) {
  return (
    <div className="ritual-row">
      <span className="ritual-section-label">{label}</span>
      <p>{body}</p>
    </div>
  );
}

// === 字符串 → 32 bit 哈希（不引依赖） ===
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
