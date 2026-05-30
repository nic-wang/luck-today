import { useMemo, useState } from 'react';
import type { CSSProperties } from 'react';
import { computeRelationToday } from '../../engine/luckEngine';
import type { MemberProfile, RelationProfile, RelationTodayResult } from '../../types';

interface Props {
  members: MemberProfile[];
  relations: RelationProfile[];
  date: Date;
}

interface RelationWithToday {
  relation: RelationProfile;
  today: RelationTodayResult;
}

export function FamilyBoard({ members, relations, date }: Props) {
  // 算所有关系的今日分数（一次算 · 后续按需排序 / 查询）
  const enriched = useMemo<RelationWithToday[]>(
    () => relations.map(r => ({ relation: r, today: computeRelationToday(r, date) })),
    [relations, date]
  );

  // Hero 主关系：牛 × 嘻
  const heroRel = enriched.find(e => e.relation.id === 'niu_xixi');

  // 自动选今日重点：牛 × 最低 + 嘻 × 最低（相对静态分数 + delta 的 today.score）
  const niuFocus = useMemo(() => {
    return [...enriched]
      .filter(e => e.relation.pair.includes('niu') && !e.relation.pair.includes('xixi'))
      .sort((a, b) => a.today.score - b.today.score)[0];
  }, [enriched]);
  const xixiFocus = useMemo(() => {
    return [...enriched]
      .filter(e => e.relation.pair.includes('xixi') && !e.relation.pair.includes('niu'))
      .sort((a, b) => a.today.score - b.today.score)[0];
  }, [enriched]);

  const featured = [heroRel, niuFocus, xixiFocus].filter(Boolean) as RelationWithToday[];

  // 矩阵交互：选中的关系 id（折叠面板内）
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selectedDetail = selectedId ? enriched.find(e => e.relation.id === selectedId) : null;

  return (
    <main className="page family-page">

      {/* 主位 · 今日双人关系 Hero */}
      {heroRel && (
        <FamilyHero entry={heroRel} members={members} />
      )}

      {/* 主位 · 今日重点关系 3 张 */}
      <SectionHeader title="今日重点关系" caption="自动选 · 牛嘻 + 各自今日最受冲的关系" />
      <div className="relation-grid">
        {featured.map(entry => (
          <RelationCard key={entry.relation.id} entry={entry} members={members} />
        ))}
      </div>

      {/* 次位 · 全员关系矩阵 折叠 */}
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
            <RelationCard entry={selectedDetail} members={members} compact />
          )}
        </div>
      </details>

      {/* 最次 · 家庭成员档案 */}
      <SectionHeader title="家庭成员" caption="名字 · 八字 · 用神 · 角色" />
      <div className="member-archive">
        {members.map(m => <MemberCard key={m.id} member={m} />)}
      </div>
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

function FamilyHero({ entry, members }: { entry: RelationWithToday; members: MemberProfile[] }) {
  const { relation, today } = entry;
  const m1 = members.find(m => m.id === relation.pair[0])!;
  const m2 = members.find(m => m.id === relation.pair[1])!;
  const polarity = today.score >= 4 ? 'do' : today.score < 3 ? 'dont' : 'neutral';
  return (
    <section className={`family-hero polarity-${polarity}`}>
      <div className="hero-pair">
        <PairAvatar member={m1} side="left" />
        <div className="hero-link">
          <span className="hero-keyword">{relation.keyword}</span>
          <strong className="hero-score">{today.score.toFixed(1)}</strong>
          <span className="hero-meta">{today.label} · {today.dayGanzhi} · {today.dayWuxing}气</span>
        </div>
        <PairAvatar member={m2} side="right" />
      </div>
      <p className="hero-essence">{relation.essence}</p>
      <p className="hero-advice"><strong>{today.advice}</strong></p>
      {relation.actions.length > 0 && (
        <ul className="hero-actions">
          {relation.actions.slice(0, 3).map(a => <li key={a}>{a}</li>)}
        </ul>
      )}
    </section>
  );
}

function PairAvatar({ member, side }: { member: MemberProfile; side: 'left' | 'right' }) {
  return (
    <div
      className={`pair-avatar pair-${side}`}
      style={{ '--accent': member.color } as CSSProperties}
    >
      <img src={`${import.meta.env.BASE_URL}${member.photo}`} alt="" />
      <span>{member.name}</span>
    </div>
  );
}

function RelationCard({
  entry,
  members,
  compact
}: {
  entry: RelationWithToday;
  members: MemberProfile[];
  compact?: boolean;
}) {
  const { relation, today } = entry;
  const m1 = members.find(m => m.id === relation.pair[0])!;
  const m2 = members.find(m => m.id === relation.pair[1])!;
  const polarity = today.score >= 4 ? 'do' : today.score < 3 ? 'dont' : 'neutral';
  return (
    <article className={`relation-card polarity-${polarity}${compact ? ' is-compact' : ''}`}>
      <header>
        <div className="rc-pair">
          <img src={`${import.meta.env.BASE_URL}${m1.photo}`} alt="" style={{ borderColor: m1.color }} />
          <span className="rc-link">×</span>
          <img src={`${import.meta.env.BASE_URL}${m2.photo}`} alt="" style={{ borderColor: m2.color }} />
        </div>
        <div className="rc-head-meta">
          <strong>{m1.name} × {m2.name}</strong>
          <em>{relation.keyword}</em>
        </div>
        <div className="rc-score">
          <strong>{today.score.toFixed(1)}</strong>
          <span>{today.label}</span>
        </div>
      </header>
      <p className="rc-conclusion">{today.advice}</p>
      {today.realtimeReasons.length > 0 && (
        <div className="rc-reasons">
          {today.realtimeReasons.slice(0, 2).map(r => <span key={r}>{r}</span>)}
        </div>
      )}
      {!compact && relation.actions.length > 0 && (
        <ul className="rc-actions">
          {relation.actions.slice(0, 2).map(a => <li key={a}>{a}</li>)}
        </ul>
      )}
    </article>
  );
}

function MemberCard({ member }: { member: MemberProfile }) {
  return (
    <article
      className="member-card"
      style={{ '--accent': member.color, '--tint': member.colorBg } as CSSProperties}
    >
      <img src={`${import.meta.env.BASE_URL}${member.photo}`} alt="" />
      <div className="mc-info">
        <strong>{member.name}</strong>
        <span className="mc-role">{member.role}</span>
        <span className="mc-bazi">{member.bazi}</span>
        <span className="mc-yong">{member.wuxing} · 用神{member.yong ?? '—'}</span>
      </div>
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
