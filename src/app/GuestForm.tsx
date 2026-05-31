import { useState, type FormEvent } from 'react';
import type { GuestInput } from './useGuestProfile';

const COLOR_PRESETS = [
  { value: '#0a84ff', label: '科技蓝' },
  { value: '#5e5ce6', label: '深紫靛' },
  { value: '#7c3aed', label: '神秘紫' },
  { value: '#ff453a', label: '警示红' },
  { value: '#ff9500', label: '暖橙黄' },
  { value: '#34c759', label: '生机绿' },
  { value: '#5C8A6B', label: '木森绿' },
  { value: '#C9A26B', label: '暖驼棕' }
];

const EMOJI_PRESETS = ['🌱', '🪴', '🌿', '✨', '⭐', '🔮', '🎯', '🎨', '🚀', '🌊', '🔥', '💎'];

interface Props {
  initialValues?: Partial<GuestInput>;
  submitLabel?: string;
  onSubmit: (input: GuestInput) => void;
  onCancel?: () => void;
}

export function GuestForm({ initialValues, submitLabel = '生成我的档案', onSubmit, onCancel }: Props) {
  const [name, setName] = useState(initialValues?.name ?? '');
  const [birthDate, setBirthDate] = useState(initialValues?.birthDate ?? '');
  const [birthHour, setBirthHour] = useState<number>(initialValues?.birthHour ?? 12);
  const [gender, setGender] = useState<'男' | '女'>(initialValues?.gender ?? '男');
  const [color, setColor] = useState(initialValues?.color ?? COLOR_PRESETS[0].value);
  const [emoji, setEmoji] = useState(initialValues?.emoji ?? EMOJI_PRESETS[0]);
  const [error, setError] = useState<string | null>(null);

  function validate(): GuestInput | null {
    if (!name.trim()) {
      setError('请填昵称');
      return null;
    }
    if (!birthDate || !/^\d{4}-\d{2}-\d{2}$/.test(birthDate)) {
      setError('请选择出生日期');
      return null;
    }
    const [y, m, d] = birthDate.split('-').map(Number);
    if (y < 1900 || y > 2100 || m < 1 || m > 12 || d < 1 || d > 31) {
      setError('出生日期不合法');
      return null;
    }
    if (typeof birthHour !== 'number' || birthHour < 0 || birthHour > 23) {
      setError('出生时辰需在 0-23 之间');
      return null;
    }
    setError(null);
    return { name: name.trim(), birthDate, birthHour, gender, color, emoji };
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const input = validate();
    if (input) onSubmit(input);
  }

  return (
    <form className="guest-form" onSubmit={handleSubmit}>
      <div className="gf-field">
        <label className="gf-label">昵称</label>
        <input
          className="gf-input"
          type="text"
          value={name}
          maxLength={12}
          placeholder="给自己起个名字"
          onChange={e => setName(e.target.value)}
        />
      </div>

      <div className="gf-row gf-row-2">
        <div className="gf-field">
          <label className="gf-label">出生日期</label>
          <input
            className="gf-input"
            type="date"
            value={birthDate}
            min="1900-01-01"
            max="2100-12-31"
            onChange={e => setBirthDate(e.target.value)}
          />
        </div>
        <div className="gf-field">
          <label className="gf-label">出生时辰 <em className="gf-hint">{formatHour(birthHour)}</em></label>
          <input
            className="gf-input gf-range"
            type="range"
            min={0}
            max={23}
            step={1}
            value={birthHour}
            onChange={e => setBirthHour(Number(e.target.value))}
          />
        </div>
      </div>

      <div className="gf-field">
        <label className="gf-label">性别</label>
        <div className="gf-toggle">
          <button
            type="button"
            className={gender === '男' ? 'is-active' : ''}
            onClick={() => setGender('男')}
          >男</button>
          <button
            type="button"
            className={gender === '女' ? 'is-active' : ''}
            onClick={() => setGender('女')}
          >女</button>
        </div>
        <p className="gf-hint-line">紫微命盘需要 · 八字推算不区分</p>
      </div>

      <div className="gf-field">
        <label className="gf-label">头像 emoji</label>
        <div className="gf-emoji-grid">
          {EMOJI_PRESETS.map(e => (
            <button
              key={e}
              type="button"
              className={`gf-emoji ${emoji === e ? 'is-active' : ''}`}
              onClick={() => setEmoji(e)}
            >{e}</button>
          ))}
        </div>
      </div>

      <div className="gf-field">
        <label className="gf-label">主题色</label>
        <div className="gf-color-grid">
          {COLOR_PRESETS.map(c => (
            <button
              key={c.value}
              type="button"
              className={`gf-color ${color === c.value ? 'is-active' : ''}`}
              style={{ '--swatch': c.value } as React.CSSProperties}
              onClick={() => setColor(c.value)}
              title={c.label}
              aria-label={c.label}
            />
          ))}
        </div>
      </div>

      {error && <p className="gf-error">{error}</p>}

      <div className="gf-actions">
        {onCancel && (
          <button type="button" className="gf-btn gf-btn-ghost" onClick={onCancel}>取消</button>
        )}
        <button type="submit" className="gf-btn gf-btn-primary">{submitLabel}</button>
      </div>

      <p className="gf-foot muted small">
        档案只存在你自己浏览器（localStorage）· 不传任何服务器
      </p>
    </form>
  );
}

function formatHour(hour: number): string {
  const HOURS_TO_ZHI: Record<number, string> = {
    23: '子', 0: '子', 1: '丑', 2: '丑', 3: '寅', 4: '寅', 5: '卯', 6: '卯',
    7: '辰', 8: '辰', 9: '巳', 10: '巳', 11: '午', 12: '午',
    13: '未', 14: '未', 15: '申', 16: '申', 17: '酉', 18: '酉',
    19: '戌', 20: '戌', 21: '亥', 22: '亥'
  };
  const padded = String(hour).padStart(2, '0');
  return `${padded}:00 · ${HOURS_TO_ZHI[hour] ?? '?'}时`;
}
