import { useEffect, useMemo, useState } from 'react';
import { algorithmVersion, computeDailyLuck } from '../engine/luckEngine';
import { ExplainPanel } from '../features/explain/ExplainPanel';
import { FortunePage } from '../features/fortune/FortunePage';
import { ProfilePage } from '../features/profile/ProfilePage';
import { TodayPage } from '../features/today/TodayPage';
import { ZiweiPage } from '../features/ziwei/ZiweiPage';
import type { MemberProfile } from '../types';
import { useTheme, type ThemeMode } from './useTheme';
import type { GuestInput } from './useGuestProfile';

type GuestView = 'today' | 'fortune' | 'ziwei' | 'explain' | 'profile';

const GUEST_VIEWS: Array<{ key: GuestView; label: string }> = [
  { key: 'today', label: '今日' },
  { key: 'profile', label: '我的档案' },
  { key: 'fortune', label: '大运' },
  { key: 'ziwei', label: '命盘' },
  { key: 'explain', label: '解释' }
];

export function GuestModeApp({
  profile,
  onLogout,
  updateGuest,
  exportShareUrl
}: {
  profile: MemberProfile;
  onLogout: () => void;
  updateGuest: (input: GuestInput) => MemberProfile;
  exportShareUrl: () => string | null;
}) {
  const [view, setView] = useState<GuestView>('today');
  const { mode, cycle } = useTheme();
  const today = useMemo(() => new Date(), []);

  // 每次 profile 变化（编辑后）重算 daily
  const daily = useMemo(() => [computeDailyLuck(profile, today)], [profile, today]);
  const focus = daily[0];
  const focusId = profile.id;

  // 切换视图后回滚 ProfilePage 的内部状态（编辑表单）通过 unmount 自动重置
  useEffect(() => {}, [view]);

  const memberEmoji = (profile as { _emoji?: string })._emoji ?? '👤';

  return (
    <div className="shell guest-shell">
      <header className="top">
        <div className="brand-block">
          <button
            type="button"
            className="brand-avatar guest-avatar"
            onClick={() => setView('profile')}
            aria-label="编辑我的档案"
            style={{ background: profile.color }}
          >
            <span className="guest-avatar-emoji">{memberEmoji}</span>
          </button>
          <div>
            <p className="eyebrow">Luck Today OS · {profile.name} 视角</p>
            <h1>命理今日</h1>
          </div>
          <button
            type="button"
            className="switch-avatar guest-logout"
            onClick={() => {
              if (window.confirm('退出后档案不会丢 · 重新进入选「继续上次档案」即可。确认退出？')) {
                onLogout();
              }
            }}
            title="退出访客"
          >
            <span>退出</span>
          </button>
        </div>
        <div className="date-chip">
          <span>{focus.ganzhi}</span>
          <strong>{focus.lunar}</strong>
        </div>
        <nav className="segmented" aria-label="页面">
          {GUEST_VIEWS.map(item => (
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
          onFocusChange={() => {}}
          members={[profile]}
        />
      )}
      {view === 'profile' && (
        <ProfilePage
          profile={profile}
          updateGuest={updateGuest}
          exportShareUrl={exportShareUrl}
          onDelete={onLogout}
        />
      )}
      {view === 'fortune' && (
        <FortunePage
          members={[profile]}
          primaryIds={[focusId]}
          focusId={focusId}
          onFocusChange={() => {}}
        />
      )}
      {view === 'ziwei' && (
        <ZiweiPage
          members={[profile]}
          primaryIds={[focusId]}
          focusId={focusId}
          onFocusChange={() => {}}
        />
      )}
      {view === 'explain' && (
        <ExplainPanel version={algorithmVersion} daily={daily} focusId={focusId} />
      )}
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
