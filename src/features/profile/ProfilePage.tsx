import { useState } from 'react';
import { GuestForm } from '../../app/GuestForm';
import type { GuestInput } from '../../app/useGuestProfile';
import type { MemberProfile } from '../../types';

interface Props {
  profile: MemberProfile;
  updateGuest: (input: GuestInput) => MemberProfile;
  exportShareUrl: () => string | null;
  onDelete: () => void;
}

export function ProfilePage({ profile, updateGuest, exportShareUrl, onDelete }: Props) {
  const [editing, setEditing] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);

  const emoji = (profile as { _emoji?: string })._emoji ?? '👤';

  async function handleShare() {
    const url = exportShareUrl();
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2200);
    } catch {
      // 兜底：旧浏览器降级 prompt
      window.prompt('复制下方链接 · 在其他设备打开即可同步档案：', url);
    }
  }

  function handleDelete() {
    if (window.confirm('确认删除档案？所有本地数据会被清空 · 不可恢复。')) {
      onDelete();
    }
  }

  function handleSubmit(input: GuestInput) {
    updateGuest(input);
    setEditing(false);
  }

  return (
    <main className="page profile-page">
      <header className="profile-hero">
        <div className="profile-avatar" style={{ background: profile.color }}>
          <span>{emoji}</span>
        </div>
        <div className="profile-id">
          <p className="eyebrow">PROFILE · 我的档案</p>
          <h2>{profile.name}</h2>
          <p className="profile-meta">{profile.bazi}</p>
        </div>
      </header>

      <section className="profile-card">
        <h3>命理摘要</h3>
        <dl className="profile-summary">
          <div>
            <dt>日主 · 主气</dt>
            <dd>{profile.wuxing}</dd>
          </div>
          <div>
            <dt>用神</dt>
            <dd>{profile.yong ?? '—'}</dd>
          </div>
          <div>
            <dt>生肖</dt>
            <dd>{profile.zodiac}</dd>
          </div>
          <div>
            <dt>性别</dt>
            <dd>{profile.gender ?? '—'}</dd>
          </div>
          <div>
            <dt>出生日期</dt>
            <dd>{profile.birthDate}</dd>
          </div>
          <div>
            <dt>出生时辰</dt>
            <dd>{formatHour(profile.birthHour ?? 12)}</dd>
          </div>
        </dl>
        <p className="profile-highlight">{profile.highlight}</p>
      </section>

      <section className="profile-card">
        <header className="profile-card-head">
          <h3>{editing ? '编辑档案' : '修改档案'}</h3>
          {!editing && (
            <button type="button" className="profile-edit-btn" onClick={() => setEditing(true)}>
              开始编辑
            </button>
          )}
        </header>
        {editing && (
          <GuestForm
            initialValues={{
              name: profile.name,
              birthDate: profile.birthDate,
              birthHour: profile.birthHour ?? 12,
              gender: (profile.gender ?? '男') as '男' | '女',
              color: profile.color,
              emoji
            }}
            submitLabel="保存修改"
            onSubmit={handleSubmit}
            onCancel={() => setEditing(false)}
          />
        )}
      </section>

      <section className="profile-card profile-share">
        <h3>跨设备同步</h3>
        <p className="muted small">
          复制下方链接 · 在另一台设备 / 浏览器打开 = 一键同步档案
          <br />
          链接里只包含你刚填的信息（昵称 / 生日 / 时辰 / 性别 / emoji / 颜色）
        </p>
        <div className="profile-share-actions">
          <button type="button" className="gf-btn gf-btn-primary" onClick={handleShare}>
            {shareCopied ? '已复制 ✓' : '复制分享链接'}
          </button>
        </div>
      </section>

      <section className="profile-card profile-danger">
        <h3>退出 / 删除档案</h3>
        <p className="muted small">
          删除档案 = 清空本浏览器所有命理数据 · 不可恢复
        </p>
        <button type="button" className="gf-btn gf-btn-danger" onClick={handleDelete}>
          删除档案 · 退出
        </button>
      </section>
    </main>
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
