import { useMemo, useState } from 'react';
import type { CSSProperties } from 'react';
import { computeRelationToday } from '../../engine/luckEngine';
import type { MemberProfile, RelationProfile, RelationTodayResult } from '../../types';

interface Props {
  members: MemberProfile[];
  relations: RelationProfile[];
  date: Date;
  focusId?: string;
}

interface RelationWithToday {
  relation: RelationProfile;
  today: RelationTodayResult;
}

export function FamilyBoard({ members, relations, date }: Props) {
  // 一次算好所有关系的今日 score
  const enriched = useMemo<RelationWithToday[]>(
    () => relations.map(r => ({ relation: r, today: computeRelationToday(r, date) })),
    [relations, date]
  );

  // 按 today.score 排序：head=最强 / tail=最需补救
  const sortedByScore = useMemo(
    () => [...enriched].sort((a, b) => b.today.score - a.today.score),
    [enriched]
  );

  const heroRel = enriched.find(e => e.relation.id === 'niu_xixi');
  const topStrong = sortedByScore[0];
  const topWeak = sortedByScore[sortedByScore.length - 1];

  const avgScore = useMemo(
    () => enriched.reduce((s, e) => s + e.today.score, 0) / Math.max(1, enriched.length),
    [enriched]
  );

  // 矩阵交互
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selectedDetail = selectedId ? enriched.find(e => e.relation.id === selectedId) : null;

  const today0 = enriched[0]?.today;
  const ganzhi = today0?.dayGanzhi ?? '';
  const wuxing = today0?.dayWuxing ?? '';

  return (
    <main className="page family-page">
      <section className="family-overview-shell">
        <header className="family-overview-head">
          <p className="eyebrow">FAMILY · {ganzhi} · {wuxing}气</p>
          <h2>家庭今日 · 共振</h2>
          <p className="muted small">{members.length} 口人 · {enriched.length} 对关系 · 平均 {avgScore.toFixed(1)} / 5</p>
        </header>

        {heroRel && <FeatureCard entry={heroRel} members={members} />}
      </section>

      <section className="family-kpi-grid">
        {topStrong && <KPICard kind="strong" entry={topStrong} members={members} />}
        {topWeak && <KPICard kind="weak" entry={topWeak} members={members} />}
      </section>

      <SectionHeader title="家庭成员" caption={`${members.length} 口 · 五行 + 当前能量`} tone="now" />
      <ul className="family-list">
        {members.map(m => <FamilyListRow key={m.id} member={m} sortedRelations={sortedByScore} />)}
      </ul>

      <details className="family-matrix-fold">
        <summary>
          <span>全员关系矩阵 · 全景查询</span>
          <b>{relations.length} 对关系 · 点格子查看</b>
        </summary>
        <div className="matrix-container">
          <div className="matrix-grid" style={{ '--size': members.length } as CSSProperties}>
            <span />
            {members.map(m => <b key={m.id}>{m.name}</b>)}
            {members.map(row => (
              <MatrixRow
                key={row.id}
                row={row}
                members={members}
                relations={relations}
                selectedId={selectedId}
                onSelect={setSelectedId}
              />
            ))}
          </div>
          {selectedDetail && (
            <RelationCardMini entry={selectedDetail} members={members} />
          )}
        </div>
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

function FeatureCard({ entry, members }: { entry: RelationWithToday; members: MemberProfile[] }) {
  const { relation, today } = entry;
  const m1 = members.find(m => m.id === relation.pair[0])!;
  const m2 = members.find(m => m.id === relation.pair[1])!;
  const polarity = today.score >= 4 ? 'do' : today.score < 3 ? 'dont' : 'neutral';
  const adviceParts = splitAdvice(today.advice);
  return (
    <article className={`family-feature-card polarity-${polarity}`}>
      <div className="ff-eyebrow">
        <span>FEATURED · {relation.keyword}</span>
        <b>{today.label}</b>
      </div>
      <p className="ff-headline">
        {adviceParts.lead && <strong>{adviceParts.lead}</strong>}
        {adviceParts.lead ? '。' : ''}
        {adviceParts.rest}
      </p>
      <div className="ff-pair-meta">
        <div className="ff-pair-avatars">
          <img src={`${import.meta.env.BASE_URL}${m1.photo}`} alt="" />
          <span>×</span>
          <img src={`${import.meta.env.BASE_URL}${m2.photo}`} alt="" />
        </div>
        <strong>{m1.name} × {m2.name}</strong>
        <span className="ff-meta-chip">{today.dayGanzhi} · {today.dayWuxing}气</span>
      </div>
    </article>
  );
}

// 把 advice 拆成"主词 + 余下"，主词加渐变 strong
function splitAdvice(text: string): { lead: string; rest: string } {
  const m = text.match(/^([^，。·,.！？]+)([，。·,.！？].*)$/);
  if (m) return { lead: m[1], rest: m[2] };
  return { lead: '', rest: text };
}

function KPICard({ kind, entry, members }: { kind: 'strong' | 'weak'; entry: RelationWithToday; members: MemberProfile[] }) {
  const { relation, today } = entry;
  const m1 = members.find(m => m.id === relation.pair[0])!;
  const m2 = members.find(m => m.id === relation.pair[1])!;
  const tone = kind === 'strong' ? 'do' : 'dont';
  const label = kind === 'strong' ? '今日最强' : '今日最需补救';
  const icon = kind === 'strong' ? '⚡' : '⚠';
  const scorePct = Math.round((today.score / 5) * 100);
  return (
    <article className={`family-kpi-card tone-${tone}`}>
      <div className="kpi-head">
        <span className="kpi-label">{label}</span>
        <span className="kpi-icon">{icon}</span>
      </div>
      <div className="kpi-num">
        <strong>{today.score.toFixed(1)}</strong>
        <span>/ 5</span>
      </div>
      <div className="kpi-meta">
        <div className="kpi-meta-cell">
          <b>{m1.name} × {m2.name}</b>
          <span>{relation.keyword}</span>
        </div>
        <div className="kpi-meta-cell">
          <b>{today.label}</b>
          <span>{today.dayWuxing}气 · {today.delta >= 0 ? '+' : ''}{today.delta.toFixed(1)}</span>
        </div>
      </div>
      <div className={`energy-spectrum kpi-spectrum tone-${tone}`}>
        <div className="es-bar">
          <span className="es-fill" style={{ width: `${scorePct}%` }} />
        </div>
        <span className="es-num">{scorePct}%</span>
      </div>
    </article>
  );
}

function FamilyListRow({ member, sortedRelations }: { member: MemberProfile; sortedRelations: RelationWithToday[] }) {
  const myRelations = sortedRelations.filter(e => e.relation.pair.includes(member.id));
  const avgScore = myRelations.length > 0
    ? myRelations.reduce((s, e) => s + e.today.score, 0) / myRelations.length
    : 3;
  const scorePct = Math.round((avgScore / 5) * 100);
  const tone = avgScore >= 4 ? 'do' : avgScore < 3 ? 'dont' : 'neutral';
  const emoji = (member as { _emoji?: string })._emoji ?? defaultEmoji(member);

  return (
    <li className="family-list-row" style={{ '--accent': member.color } as CSSProperties}>
      <div className="fl-avatar">
        {member.photo
          ? <img src={`${import.meta.env.BASE_URL}${member.photo}`} alt="" />
          : <span>{emoji}</span>
        }
      </div>
      <div className="fl-info">
        <div className="fl-name">{member.name}</div>
        <div className="fl-role">{member.role}</div>
      </div>
      <div className="fl-right">
        <span className="fl-chip">{member.mainWuxing}</span>
        <div className={`energy-spectrum fl-spectrum tone-${tone}`}>
          <div className="es-bar">
            <span className="es-fill" style={{ width: `${scorePct}%` }} />
          </div>
        </div>
      </div>
    </li>
  );
}

function defaultEmoji(member: MemberProfile): string {
  if (member.kind === 'pet') return '🐾';
  return member.gender === '女' ? '👩' : '👨';
}

function RelationCardMini({ entry, members }: { entry: RelationWithToday; members: MemberProfile[] }) {
  const { relation, today } = entry;
  const m1 = members.find(m => m.id === relation.pair[0])!;
  const m2 = members.find(m => m.id === relation.pair[1])!;
  const tone = today.score >= 4 ? 'do' : today.score < 3 ? 'dont' : 'neutral';
  return (
    <article className={`relation-card-mini tone-${tone}`}>
      <header className="rcm-head">
        <strong>{m1.name} × {m2.name}</strong>
        <em>{relation.keyword}</em>
      </header>
      <div className="rcm-score">
        <b>{today.score.toFixed(1)}</b>
        <span>/ 5 · {today.label}</span>
      </div>
      <p className="rcm-conclusion">{today.advice}</p>
      {today.realtimeReasons.length > 0 && (
        <div className="rcm-reasons">
          {today.realtimeReasons.slice(0, 3).map(r => <span key={r}>{r}</span>)}
        </div>
      )}
    </article>
  );
}

function MatrixRow({
  row,
  members,
  relations,
  selectedId,
  onSelect
}: {
  row: MemberProfile;
  members: MemberProfile[];
  relations: RelationProfile[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <>
      <b>{row.name}</b>
      {members.map(column => {
        if (row.id === column.id) return <span key={column.id} className="matrix-cell diag">-</span>;
        const relation = relations.find(item => item.id === [row.id, column.id].sort().join('_'));
        const tone = relation ? Math.round(relation.score) : 0;
        return (
          <button
            key={column.id}
            type="button"
            className={`matrix-cell tone-${tone}${relation?.id === selectedId ? ' active' : ''}`}
            onClick={() => relation && onSelect(relation.id)}
          >
            {relation ? relation.score.toFixed(1) : '-'}
          </button>
        );
      })}
    </>
  );
}
