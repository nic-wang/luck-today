import { useMemo, useState } from 'react';
import { members, primaryMemberIds } from '../data/members';
import { relations } from '../data/relations';
import { algorithmVersion, computeDailyLuck } from '../engine/luckEngine';
import { ExplainPanel } from '../features/explain/ExplainPanel';
import { FamilyBoard } from '../features/family/FamilyBoard';
import { TodayPage } from '../features/today/TodayPage';
import { usePinGate } from './usePinGate';
import { useTheme, type ThemeMode } from './useTheme';

type ViewKey = 'today' | 'family' | 'explain';

const views: Array<{ key: ViewKey; label: string }> = [
  { key: 'today', label: '今日' },
  { key: 'family', label: '家庭' },
  { key: 'explain', label: '解释' }
];

export function App() {
  const [view, setView] = useState<ViewKey>('today');
  const [focusId, setFocusId] = useState(primaryMemberIds[0]);
  const { passed, error, submit, isPwa } = usePinGate();
  const { mode, cycle } = useTheme();
  const today = useMemo(() => new Date(), []);
  const daily = useMemo(() => {
    return primaryMemberIds.map(id => {
      const member = members.find(item => item.id === id)!;
      return computeDailyLuck(member, today);
    });
  }, [today]);
  const focus = daily.find(item => item.memberId === focusId) ?? daily[0];

  return (
    <div className="shell">
      {!passed && <PinGate error={error} isPwa={isPwa} onSubmit={submit} />}
      <header className="top">
        <div className="brand-block">
          <img src={`${import.meta.env.BASE_URL}assets/icons/icon-192.png`} alt="" />
          <div>
            <p className="eyebrow">Luck Today OS</p>
            <h1>命理今日</h1>
          </div>
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

      {view === 'today' && (
        <TodayPage
          daily={daily}
          focusId={focusId}
          onFocusChange={setFocusId}
          members={members}
        />
      )}
      {view === 'family' && <FamilyBoard members={members} relations={relations} date={today} />}
      {view === 'explain' && <ExplainPanel version={algorithmVersion} daily={daily} />}
    </div>
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

  async function update(value: string) {
    const next = value.replace(/\D/g, '').slice(0, 4);
    setPin(next);
    if (next.length === 4) {
      const ok = await onSubmit(next);
      if (!ok) setPin('');
    }
  }

  return (
    <div className="pin-overlay">
      <div className={`pin-card ${error ? 'shake' : ''}`}>
        <div className="pin-icon">🔐</div>
        <h2>命理今日</h2>
        <p>{isPwa ? '访问码 · 已安装版本会记住' : '请输入访问码'}</p>
        <div className="pin-dots" aria-hidden="true">
          {[0, 1, 2, 3].map(index => <span key={index} className={index < pin.length ? 'filled' : ''} />)}
        </div>
        <input
          autoFocus
          inputMode="numeric"
          aria-label="访问码"
          value={pin}
          onChange={event => update(event.target.value)}
        />
      </div>
    </div>
  );
}
