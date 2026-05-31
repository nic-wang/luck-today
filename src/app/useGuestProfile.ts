import { useEffect, useState } from 'react';
import { buildBazi } from '../engine/adapters/tyme4ts-bazi';
import type { MemberProfile, Wuxing } from '../types';

const STORAGE_KEY = 'luck-guest-profile';
const URL_PARAM = 'guest';

// === 用户输入最小集 ===
export interface GuestInput {
  name: string;
  birthDate: string;       // YYYY-MM-DD
  birthHour: number;       // 0-23
  gender: '男' | '女';
  color?: string;          // 可选 · 默认 #6e6e73 (灰)
  emoji?: string;          // 可选 · 头像 emoji（无图）
}

// === 干支 / 五行 / 生肖 衍生表（与 luckEngine 同源 · 此处为 guest 导出复制以解耦）===
const TIANGAN_WUXING: Record<string, Wuxing> = {
  甲: '木', 乙: '木', 丙: '火', 丁: '火', 戊: '土',
  己: '土', 庚: '金', 辛: '金', 壬: '水', 癸: '水'
};
const SHENGXIAO: Record<string, { name: string; emoji: string }> = {
  子: { name: '鼠', emoji: '🐭' }, 丑: { name: '牛', emoji: '🐂' },
  寅: { name: '虎', emoji: '🐯' }, 卯: { name: '兔', emoji: '🐰' },
  辰: { name: '龙', emoji: '🐉' }, 巳: { name: '蛇', emoji: '🐍' },
  午: { name: '马', emoji: '🐎' }, 未: { name: '羊', emoji: '🐏' },
  申: { name: '猴', emoji: '🐒' }, 酉: { name: '鸡', emoji: '🐔' },
  戌: { name: '狗', emoji: '🐕' }, 亥: { name: '猪', emoji: '🐖' }
};
function seasonYong(monthZhi: string): Wuxing {
  if ('亥子丑'.includes(monthZhi)) return '火';
  if ('巳午未'.includes(monthZhi)) return '水';
  if ('寅卯辰'.includes(monthZhi)) return '金';
  if ('申酉戌'.includes(monthZhi)) return '火';
  return '土';
}

// === 输入 → 完整 MemberProfile ===
export function deriveGuestProfile(input: GuestInput): MemberProfile {
  const [year, month, day] = input.birthDate.split('-').map(Number);
  const pillars = buildBazi(year, month, day, input.birthHour);
  const dayWx = TIANGAN_WUXING[pillars.dayGan] ?? '土';
  const yong = seasonYong(pillars.monthZhi);
  const zodiac = SHENGXIAO[pillars.yearZhi] ?? { name: '?', emoji: '👤' };

  return {
    id: 'guest',
    name: input.name.trim() || '访客',
    alias: input.name.trim() || '访客',
    kind: 'human',
    role: '访客 · 自建档案',
    color: input.color ?? '#6e6e73',
    colorBg: '#f0f0f3',
    photo: '',  // 空 photo · UI 用 emoji 兜底
    photoPos: 'center center',
    birthDate: input.birthDate,
    birthHour: input.birthHour,
    gender: input.gender,
    bazi: `${pillars.yearGan}${pillars.yearZhi}·${pillars.monthGan}${pillars.monthZhi}·${pillars.dayGan}${pillars.dayZhi}·${pillars.timeGan}${pillars.timeZhi}`,
    zodiac: `${zodiac.emoji} ${zodiac.name}`,
    wuxing: `${pillars.dayGan}${dayWx}`,
    yong,
    mainWuxing: dayWx,
    chips: [`${pillars.dayGan}${dayWx}`, `用神${yong}`, `${zodiac.emoji}${zodiac.name}`],
    highlight: `${pillars.dayGan}${dayWx}日主 · 月令${pillars.monthZhi}（用神${yong}）`,
    isGuest: true,
    // emoji fallback 通过额外字段携带（types 不要求 · 但 UI 可读）
    ...(input.emoji ? { _emoji: input.emoji } : {})
  } as MemberProfile;
}

// === localStorage CRUD ===
function readStorage(): MemberProfile | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    // 校验必需字段
    if (!parsed?.birthDate || !parsed?.id) return null;
    return parsed as MemberProfile;
  } catch {
    return null;
  }
}

function writeStorage(profile: MemberProfile) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
}

function clearStorage() {
  localStorage.removeItem(STORAGE_KEY);
}

// === URL 序列化 · 跨设备分享 ===
// 只编码用户输入字段（GuestInput）· 减小 URL 体积 · 接收方重新 derive
export function exportToUrl(profile: MemberProfile): string {
  const input: GuestInput = {
    name: profile.name,
    birthDate: profile.birthDate,
    birthHour: profile.birthHour ?? 12,
    gender: (profile.gender ?? '男') as '男' | '女',
    color: profile.color,
    emoji: (profile as { _emoji?: string })._emoji
  };
  const json = JSON.stringify(input);
  // base64url 编码（兼容 URL · 不含 + / =）
  const base64 = btoa(unescape(encodeURIComponent(json)));
  const safe = base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  const origin = typeof window !== 'undefined' ? `${window.location.origin}${window.location.pathname}` : '';
  return `${origin}?${URL_PARAM}=${safe}`;
}

export function decodeFromUrl(searchParams: URLSearchParams): GuestInput | null {
  const raw = searchParams.get(URL_PARAM);
  if (!raw) return null;
  try {
    const padded = raw.replace(/-/g, '+').replace(/_/g, '/');
    const padding = padded.length % 4 ? '='.repeat(4 - (padded.length % 4)) : '';
    const json = decodeURIComponent(escape(atob(padded + padding)));
    const input = JSON.parse(json) as GuestInput;
    if (!input.birthDate || typeof input.birthHour !== 'number') return null;
    return input;
  } catch {
    return null;
  }
}

// === Hook ===
export interface UseGuestProfile {
  profile: MemberProfile | null;
  hasStored: boolean;          // localStorage 是否已存档案
  createGuest: (input: GuestInput) => MemberProfile;
  updateGuest: (input: GuestInput) => MemberProfile;
  deleteGuest: () => void;
  resumeFromStorage: () => MemberProfile | null;
  importFromUrl: (searchParams: URLSearchParams) => MemberProfile | null;
  exportShareUrl: () => string | null;
}

export function useGuestProfile(): UseGuestProfile {
  const [profile, setProfile] = useState<MemberProfile | null>(null);
  const [hasStored, setHasStored] = useState(false);

  useEffect(() => {
    const stored = readStorage();
    setHasStored(!!stored);
  }, []);

  function createGuest(input: GuestInput): MemberProfile {
    const next = deriveGuestProfile(input);
    writeStorage(next);
    setProfile(next);
    setHasStored(true);
    return next;
  }

  function updateGuest(input: GuestInput): MemberProfile {
    return createGuest(input); // 同 createGuest · 覆盖
  }

  function deleteGuest() {
    clearStorage();
    setProfile(null);
    setHasStored(false);
  }

  function resumeFromStorage(): MemberProfile | null {
    const stored = readStorage();
    if (stored) {
      setProfile(stored);
      setHasStored(true);
    }
    return stored;
  }

  function importFromUrl(searchParams: URLSearchParams): MemberProfile | null {
    const input = decodeFromUrl(searchParams);
    if (!input) return null;
    const next = deriveGuestProfile(input);
    writeStorage(next);
    setProfile(next);
    setHasStored(true);
    return next;
  }

  function exportShareUrl(): string | null {
    if (!profile) return null;
    return exportToUrl(profile);
  }

  return {
    profile,
    hasStored,
    createGuest,
    updateGuest,
    deleteGuest,
    resumeFromStorage,
    importFromUrl,
    exportShareUrl
  };
}
