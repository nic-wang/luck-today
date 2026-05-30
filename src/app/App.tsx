import { useEffect, useMemo, useRef, useState } from 'react';
import { members, primaryMemberIds } from '../data/members';
import { relations } from '../data/relations';
import { algorithmVersion, computeDailyLuck } from '../engine/luckEngine';
import { ExplainPanel } from '../features/explain/ExplainPanel';
import { FamilyBoard } from '../features/family/FamilyBoard';
import { FortunePage } from '../features/fortune/FortunePage';
import { TodayPage } from '../features/today/TodayPage';
import { ZiweiPage } from '../features/ziwei/ZiweiPage';
import { usePinGate } from './usePinGate';
import { useTheme, type ThemeMode } from './useTheme';

type ViewKey = 'today' | 'family' | 'fortune' | 'ziwei' | 'explain' | 'hub';

const views: Array<{ key: ViewKey; label: string }> = [
  { key: 'today', label: '今日' },
  { key: 'family', label: '家庭' },
  { key: 'fortune', label: '大运' },
  { key: 'ziwei', label: '命盘' },
  { key: 'explain', label: '解释' }
];

export function App() {
  const [view, setView] = useState<ViewKey>('today');
  const { passed, defaultMemberId, error, submit, isPwa } = usePinGate();
  // focusId 由 PIN 决定初始值 · 整站单人视角
  const [focusId, setFocusId] = useState<string>(defaultMemberId);
  // PIN 通过后同步 focusId（首次设默认）
  useEffect(() => {
    if (passed) setFocusId(defaultMemberId);
  }, [passed, defaultMemberId]);

  const { mode, cycle } = useTheme();
  const today = useMemo(() => new Date(), []);
  const daily = useMemo(() => {
    return primaryMemberIds.map(id => {
      const member = members.find(item => item.id === id)!;
      return computeDailyLuck(member, today);
    });
  }, [today]);
  const focus = daily.find(item => item.memberId === focusId) ?? daily[0];
  const focusMember = members.find(m => m.id === focusId)!;
  const otherId = primaryMemberIds.find(id => id !== focusId)!;
  const otherMember = members.find(m => m.id === otherId)!;

  function switchPerson() {
    setFocusId(otherId);
    if (view === 'hub') setView('today');
  }
  function gotoHub() {
    setView('hub');
  }

  return (
    <div className="shell">
      {!passed && <PinGate error={error} isPwa={isPwa} onSubmit={submit} />}
      <header className="top">
        <div className="brand-block">
          {/* 当前聚焦人头像 · 点 → 进 hub 选人页 */}
          <button type="button" className="brand-avatar" onClick={gotoHub} aria-label="切换视角">
            <img src={`${import.meta.env.BASE_URL}${focusMember.photo}`} alt={focusMember.name} />
          </button>
          <div>
            <p className="eyebrow">Luck Today OS · {focusMember.name} 视角</p>
            <h1>命理今日</h1>
          </div>
          {/* 对方头像 · 点 = 直接切到对方 */}
          <button
            type="button"
            className="switch-avatar"
            onClick={switchPerson}
            aria-label={`切到 ${otherMember.name}`}
            title={`切到 ${otherMember.name}`}
          >
            <img src={`${import.meta.env.BASE_URL}${otherMember.photo}`} alt={otherMember.name} />
            <span>切到{otherMember.name}</span>
          </button>
        </div>
        <div className="date-chip">
          <span>{focus.ganzhi}</span>
          <strong>{focus.lunar}</strong>
        </div>
        <nav className="segmented" aria-label="页面">
          {views.map(item => (
            <button
              key={item.key}
              type="button"
              className={view === item.key ? 'active' : ''}
              onClick={() => setView(item.key)}
            >
              {item.label}
            </button>
          ))}
          <ThemeToggle mode={mode} onCycle={cycle} />
        </nav>
      </header>

      {view === 'hub' && (
        <HubPage
          members={members}
          primaryIds={primaryMemberIds}
          focusId={focusId}
          onPick={(id) => { setFocusId(id); setView('today'); }}
        />
      )}
      {view === 'today' && (
        <TodayPage
          daily={daily}
          focusId={focusId}
          onFocusChange={setFocusId}
          members={members}
        />
      )}
      {view === 'family' && <FamilyBoard members={members} relations={relations} date={today} focusId={focusId} />}
      {view === 'fortune' && <FortunePage members={members} primaryIds={primaryMemberIds} focusId={focusId} onFocusChange={setFocusId} />}
      {view === 'ziwei' && <ZiweiPage members={members} primaryIds={primaryMemberIds} focusId={focusId} onFocusChange={setFocusId} />}
      {view === 'explain' && <ExplainPanel version={algorithmVersion} daily={daily} focusId={focusId} />}
    </div>
  );
}

function HubPage({
  members,
  primaryIds,
  focusId,
  onPick
}: {
  members: typeof import('../data/members').members;
  primaryIds: string[];
  focusId: string;
  onPick: (id: string) => void;
}) {
  return (
    <main className="page hub-page">
      <p className="hub-eyebrow">选一个视角进入</p>
      <h2 className="hub-title">今天看谁的命理？</h2>
      <div className="hub-grid">
        {primaryIds.map(id => {
          const m = members.find(x => x.id === id)!;
          const active = id === focusId;
          return (
            <button
              key={id}
              type="button"
              className={`hub-card${active ? ' is-active' : ''}`}
              onClick={() => onPick(id)}
            >
              <img src={`${import.meta.env.BASE_URL}${m.photo}`} alt={m.name} />
              <strong>{m.name}</strong>
              <span>{m.wuxing} · 用神{m.yong ?? '—'}</span>
              {active && <em className="hub-active-tag">当前视角</em>}
            </button>
          );
        })}
      </div>
      <p className="hub-foot muted small">单人视角 · 顶部右侧头像可一键互切 · 信息互不干扰</p>
    </main>
  );
}

function ThemeToggle({ mode, onCycle }: { mode: ThemeMode; onCycle: () => void }) {
  const label = mode === 'auto' ? '跟随系统' : mode === 'light' ? '浅色' : '深色';
  const icon = mode === 'auto' ? '◐' : mode === 'light' ? '☀' : '☾';
  const next = mode === 'auto' ? '切到浅色' : mode === 'light' ? '切到深色' : '切回跟随系统';
  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={onCycle}
      aria-label={`主题：${label}，点击${next}`}
      title={`主题：${label}（${next}）`}
    >
      <span className="icon" aria-hidden="true">{icon}</span>
      <span>{label}</span>
    </button>
  );
}

function PinGate({
  error,
  isPwa,
  onSubmit
}: {
  error: boolean;
  isPwa: boolean;
  onSubmit: (pin: string) => Promise<boolean>;
}) {
  const [pin, setPin] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  async function update(value: string) {
    const next = value.replace(/\D/g, '').slice(0, 4);
    setPin(next);
    if (next.length === 4) {
      const ok = await onSubmit(next);
      if (!ok) setPin('');
    }
  }

  function focusInput() {
    inputRef.current?.focus();
  }

  return (
    <div className="pin-overlay" onClick={focusInput}>
      <div className={`pin-card ${error ? 'shake' : ''}`}>
        <div className="pin-icon">🔐</div>
        <h2>命理今日</h2>
        <p>{isPwa ? '访问码 · 已安装版本会记住' : '点击下方圆点 · 输入 4 位访问码'}</p>
        {/* label 包裹：tap dots = 自动 focus input · 解决 mobile 无法输入 */}
        <label className="pin-input-area">
          <span className="pin-dots" aria-hidden="true">
            {[0, 1, 2, 3].map(index => <span key={index} className={index < pin.length ? 'filled' : ''} />)}
          </span>
          <input
            ref={inputRef}
            autoFocus
            inputMode="numeric"
            pattern="[0-9]*"
            type="tel"
            autoComplete="off"
            aria-label="访问码"
            value={pin}
            onChange={event => update(event.target.value)}
          />
        </label>
      </div>
    </div>
  );
}
