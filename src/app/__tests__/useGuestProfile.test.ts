import { describe, expect, it } from 'vitest';
import { decodeFromUrl, deriveGuestProfile, exportToUrl, type GuestInput } from '../useGuestProfile';

describe('useGuestProfile · pure functions', () => {
  const sampleInput: GuestInput = {
    name: '小明',
    birthDate: '1990-06-15',
    birthHour: 14,
    gender: '男',
    color: '#5C8A6B',
    emoji: '🌱'
  };

  it('deriveGuestProfile · 自动算 bazi / mainWuxing / yong / zodiac', () => {
    const profile = deriveGuestProfile(sampleInput);
    expect(profile.id).toBe('guest');
    expect(profile.isGuest).toBe(true);
    expect(profile.name).toBe('小明');
    expect(profile.kind).toBe('human');
    expect(profile.gender).toBe('男');
    expect(profile.birthDate).toBe('1990-06-15');
    expect(profile.birthHour).toBe(14);
    // bazi 4 柱（年·月·日·时）· 共 4 个 · 字符不空
    expect(profile.bazi.split('·')).toHaveLength(4);
    // mainWuxing 必须是五行之一
    expect(['金', '木', '水', '火', '土']).toContain(profile.mainWuxing);
    // 用神
    expect(['金', '木', '水', '火', '土']).toContain(profile.yong);
    // zodiac 含 emoji + 空格 + 中文名
    expect(profile.zodiac).toMatch(/ [鼠牛虎兔龙蛇马羊猴鸡狗猪]$/);
    expect(profile.zodiac.length).toBeGreaterThanOrEqual(3);
    // chips 至少 3 条
    expect(profile.chips.length).toBeGreaterThanOrEqual(3);
  });

  it('URL 序列化往返 · exportToUrl → decodeFromUrl 还原', () => {
    const profile = deriveGuestProfile(sampleInput);
    const url = exportToUrl(profile);
    expect(url).toContain('guest=');
    // 提取 guest 参数
    const search = new URL(url, 'http://x').searchParams;
    const decoded = decodeFromUrl(search);
    expect(decoded).not.toBeNull();
    expect(decoded?.name).toBe(sampleInput.name);
    expect(decoded?.birthDate).toBe(sampleInput.birthDate);
    expect(decoded?.birthHour).toBe(sampleInput.birthHour);
    expect(decoded?.gender).toBe(sampleInput.gender);
    expect(decoded?.color).toBe(sampleInput.color);
    expect(decoded?.emoji).toBe(sampleInput.emoji);
  });

  it('decodeFromUrl · 无 guest 参数返回 null', () => {
    const search = new URLSearchParams('foo=bar');
    expect(decodeFromUrl(search)).toBeNull();
  });

  it('decodeFromUrl · 损坏 base64 返回 null', () => {
    const search = new URLSearchParams('guest=!@#$%^');
    expect(decodeFromUrl(search)).toBeNull();
  });

  it('deriveGuestProfile · 不同时辰得到不同 timeGan/timeZhi', () => {
    const a = deriveGuestProfile({ ...sampleInput, birthHour: 2 });
    const b = deriveGuestProfile({ ...sampleInput, birthHour: 14 });
    // 时柱（最后一段）应不同
    const aTime = a.bazi.split('·').pop();
    const bTime = b.bazi.split('·').pop();
    expect(aTime).not.toBe(bTime);
  });

  it('deriveGuestProfile · 空 name 兜底为 "访客"', () => {
    const profile = deriveGuestProfile({ ...sampleInput, name: '   ' });
    expect(profile.name).toBe('访客');
  });
});
