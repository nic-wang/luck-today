import { useMemo, useState } from 'react';
import type { CSSProperties } from 'react';
import { computeRelationToday } from '../../engine/luckEngine';
import type { MemberProfile, RelationProfile } from '../../types';

export function FamilyBoard({
  members,
  relations,
  date
}: {
  members: MemberProfile[];
  relations: RelationProfile[];
  date: Date;
}) {
  const [selectedId, setSelectedId] = useState(relations[0]?.id ?? '');
  const selected = relations.find(item => item.id === selectedId) ?? relations[0];
  const today = useMemo(() => selected ? computeRelationToday(selected, date) : null, [selected, date]);

  return (
    <main className="page family-page">
      <section className="team-map">
        <div className="team-title">
          <p className="eyebrow">The Team</p>
          <h2>半饱家的运行结构</h2>
        </div>
        <div className="org-chart">
          <div className="partner-row">
            <Node member={members.find(member => member.id === 'niu')!} title="Human · 主理" />
            <Node member={members.find(member => member.id === 'xixi')!} title="Human · 主出镜" />
          </div>
          <div className="engine-label">Clockless Engine</div>
          <div className="pet-row">
            {members.filter(member => member.kind === 'pet').map(member => (
              <button key={member.id} type="button" className="pet-node" onClick={() => pickFirstRelation(member.id, relations, setSelectedId)}>
                <img src={`${import.meta.env.BASE_URL}${member.photo}`} alt="" />
                <strong>{member.name}</strong>
                <span>{member.role}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="matrix-section">
        <div className="panel matrix-panel">
          <div className="panel-title">
            <p className="eyebrow">Relation Matrix</p>
            <h3>关系矩阵</h3>
          </div>
          <div className="matrix-grid" style={{ '--size': members.length } as CSSProperties}>
            <span />
            {members.map(member => <b key={member.id}>{member.name}</b>)}
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
        </div>

        {selected && today && (
          <article className="panel relation-detail">
            <div className="panel-title">
              <p className="eyebrow">Today Interaction</p>
              <h3>{names(selected, members)}</h3>
            </div>
            <div className="relation-score">
              <strong>{today.score.toFixed(1)}</strong>
              <span>{today.label} · {today.dayGanzhi} · {today.dayWuxing}气</span>
            </div>
            <h4>{selected.keyword}</h4>
            <p>{selected.essence}</p>
            <p className="muted">{today.advice}</p>
            <div className="realtime-reasons">
              {today.realtimeReasons.map(reason => <span key={reason}>{reason}</span>)}
            </div>
            <div className="action-list">
              {selected.actions.map(action => <span key={action}>✓ {action}</span>)}
            </div>
          </article>
        )}
      </section>
    </main>
  );
}

function Node({ member, title }: { member: MemberProfile; title: string }) {
  return (
    <div className="human-node" style={{ '--accent': member.color, '--tint': member.colorBg } as CSSProperties}>
      <img src={`${import.meta.env.BASE_URL}${member.photo}`} alt="" />
      <strong>{member.name}</strong>
      <span>{title}</span>
    </div>
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
  selectedId: string;
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
            className={`matrix-cell tone-${tone} ${relation?.id === selectedId ? 'active' : ''}`}
            onClick={() => relation && onSelect(relation.id)}
          >
            {relation ? relation.score.toFixed(1) : '-'}
          </button>
        );
      })}
    </>
  );
}

function names(relation: RelationProfile, members: MemberProfile[]) {
  return relation.pair.map(id => members.find(member => member.id === id)?.name ?? id).join(' × ');
}

function pickFirstRelation(id: string, relations: RelationProfile[], setter: (id: string) => void) {
  const relation = relations.find(item => item.pair.includes(id));
  if (relation) setter(relation.id);
}
