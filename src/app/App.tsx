import { useEffect, useMemo, useRef, useState } from 'react';
import { members, primaryMemberIds } from '../data/members';
import { relations } from '../data/relations';
import { algorithmVersion, computeDailyLuck } from '../engine/luckEngine';
import { ExplainPanel } from '../features/explain/ExplainPanel';
import { FamilyBoard } from '../features/family/FamilyBoard';
import { FortunePage } from '../features/fortune/FortunePage';
import { TodayPage } from '../features/today/TodayPage';
import { ZiweiPage } from '../features/ziwei/ZiweiPage';
import { GuestModeApp } from './GuestModeApp';
import { GuestForm } from './GuestForm';
import { useGuestProfile } from './useGuestProfile';
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

type AuthMode = 'pin' | 'guest' | null;

export function App() {
  const pin = usePinGate();
  const guest = useGuestProfile();
  const [authMode, setAuthMode] = useState<AuthMode>(null);

  // 启动时：URL 携带 ?guest= 参数 → 自动导入 + 进访客模式
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const search = new URLSearchParams(window.location.search);
    if (search.has('guest')) {
      const imported = guest.importFromUrl(search);
      if (imported) {
        setAuthMode('guest');
        // 清掉 URL 参数 · 防止反复 import
        window.history.replaceState({}, '', window.location.pathname);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // PIN 验证通过 → 切到 PIN 模式
  useEffect(() => {
    if (pin.passed) setAuthMode('pin');
  }, [pin.passed]);

  // 已有 guest profile · 访客已登录
  useEffect(() => {
    if (guest.profile && !pin.passed) setAuthMode('guest');
  }, [guest.profile, pin.passed]);

  function handleCreateGuest(input: Parameters<typeof guest.createGuest>[0]) {
    guest.createGuest(input);
    setAuthMode('guest');
  }

  function handleResumeGuest() {
    const resumed = guest.resumeFromStorage();
    if (resumed) setAuthMode('guest');
  }

  function handleGuestLogout() {
    guest.deleteGuest();
    setAuthMode(null);
  }

  if (authMode === 'guest' && guest.profile) {
    return <GuestModeApp profile={guest.profile} onLogout={handleGuestLogout} updateGuest={guest.updateGuest} exportShareUrl={guest.exportShareUrl} />;
  }

  if (authMode === 'pin') {
    return <PinModeApp pinDefaultId={pin.defaultMemberId} />;
  }

  return (
    <PinGate
      error={pin.error}
      isPwa={pin.isPwa}
      hasGuestStored={guest.hasStored}
      onSubmit={pin.submit}
      onCreateGuest={handleCreateGuest}
      onResumeGuest={handleResumeGuest}
    />
  );
}

function PinModeApp({ pinDefaultId }: { pinDefaultId: 'niu' | 'xixi' }) {
  const [view, setView] = useState<ViewKey>('today');
  const [focusId, setFocusId] = useState<string>(pinDefaultId);
  useEffect(() => { setFocusId(pinDefaultId); }, [pinDefaultId]);

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
      <header className="top">
        <div className="brand-block">
          <button type="button" className="brand-avatar" onClick={gotoHub} aria-label="切换视角">
            <img src={`${import.meta.env.BASE_URL}${focusMember.photo}`} alt={focusMember.name} />
          </button>
          <div>
            <p className="eyebrow">Luck Today OS · {focusMember.name} 视角</p>
            <h1>命理今日</h1>
          </div>
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
  hasGuestStored,
  onSubmit,
  onCreateGuest,
  onResumeGuest
}: {
  error: boolean;
  isPwa: boolean;
  hasGuestStored: boolean;
  onSubmit: (pin: string) => Promise<boolean>;
  onCreateGuest: (input: Parameters<ReturnType<typeof useGuestProfile>['createGuest']>[0]) => void;
  onResumeGuest: () => void;
}) {
  const [pin, setPin] = useState('');
  const [showGuestForm, setShowGuestForm] = useState(false);
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

  if (showGuestForm) {
    return (
      <div className="pin-overlay">
        <div className="pin-card guest-card">
          <h2>新建访客档案</h2>
          <p className="muted small">填这 4 项 · 立刻看自己的命理今日</p>
          <GuestForm
            submitLabel="生成档案 · 进入"
            onSubmit={input => onCreateGuest(input)}
            onCancel={() => setShowGuestForm(false)}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="pin-overlay" onClick={focusInput}>
      <div className={`pin-card ${error ? 'shake' : ''}`}>
        <div className="pin-icon">PIN</div>
        <h2>命理今日</h2>
        <p>{isPwa ? '访问码 · 已安装版本会记住' : '点击下方圆点 · 输入 4 位访问码'}</p>
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

        <div className="pin-divider"><span>或</span></div>

        <div className="pin-guest-actions">
          {hasGuestStored && (
            <button type="button" className="pin-guest-btn pin-guest-resume" onClick={onResumeGuest}>
              继续上次档案
            </button>
          )}
          <button type="button" className="pin-guest-btn pin-guest-create" onClick={() => setShowGuestForm(true)}>
            新建访客档案
          </button>
        </div>

        <p className="pin-foot muted small">
          访客档案存你自己浏览器 · 完全隔离主理人数据
        </p>
      </div>
    </div>
  );
}
