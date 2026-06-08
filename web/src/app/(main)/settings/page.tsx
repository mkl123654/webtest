'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';

const AVATAR_OPTIONS = ['🐱', '🐶', '🐰', '🦊', '🐼', '🐨', '🐯', '🐸', '🐵', '🐤', '🦄', '🐙'];

export default function SettingsPage() {
  const { user, refreshUser } = useAuth();

  const [avatar, setAvatar] = useState(user?.avatar || '🐱');
  const [username, setUsername] = useState(user?.username || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [profileMsg, setProfileMsg] = useState('');

  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMsg, setPasswordMsg] = useState('');

  useEffect(() => {
    if (user) {
      setAvatar(user.avatar);
      setUsername(user.username);
      setBio(user.bio);
    }
  }, [user]);

  const handleSaveProfile = async () => {
    setProfileMsg('');
    if (!username.trim()) { setProfileMsg('❌ 用户名不能为空'); return; }
    try {
      await api.put('/users/me', { username: username.trim(), avatar, bio: bio.trim() });
      setProfileMsg('✅ 保存成功');
      refreshUser();
    } catch (err: any) {
      setProfileMsg(`❌ ${err.message || '保存失败'}`);
    }
  };

  const handleChangePassword = async () => {
    setPasswordMsg('');
    if (!oldPassword) { setPasswordMsg('❌ 请输入原密码'); return; }
    if (newPassword.length < 6) { setPasswordMsg('❌ 新密码至少6位'); return; }
    if (newPassword !== confirmPassword) { setPasswordMsg('❌ 两次新密码不一致'); return; }
    try {
      await api.put('/users/me/password', { oldPassword, newPassword });
      setPasswordMsg('✅ 密码修改成功');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setPasswordMsg(`❌ ${err.message || '修改失败'}`);
    }
  };

  return (
    <div style={{ padding: '36px 48px' }}>
      <h2 style={styles.pageTitle}>⚙️ 账号设置</h2>

      <div style={styles.twoCol}>
        {/* Left column: Profile */}
        <div style={styles.column}>
          <h3 style={styles.sectionTitle}>个人资料</h3>

          <div style={{ fontSize: 48, textAlign: 'center', marginBottom: 14 }}>{avatar}</div>
          <div style={styles.avatarGrid}>
            {AVATAR_OPTIONS.map((a) => (
              <button
                key={a}
                style={{
                  ...styles.avatarOption,
                  ...(avatar === a ? styles.avatarOptionActive : {}),
                }}
                onClick={() => setAvatar(a)}
              >
                {a}
              </button>
            ))}
          </div>

          <label style={styles.label}>用户名</label>
          <input
            style={styles.input}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            maxLength={50}
          />

          <label style={styles.label}>个人介绍</label>
          <textarea
            style={{ ...styles.input, height: 80, resize: 'vertical' as const }}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            maxLength={200}
            placeholder="介绍一下自己…"
          />

          {profileMsg && (
            <p style={{ fontSize: 13, marginTop: 8, color: profileMsg.startsWith('✅') ? '#7d9a70' : '#c0392b' }}>
              {profileMsg}
            </p>
          )}
          <button style={styles.btn} onClick={handleSaveProfile}>保存资料</button>
        </div>

        {/* Right column: Password */}
        <div style={styles.column}>
          <h3 style={styles.sectionTitle}>修改密码</h3>

          <label style={styles.label}>原密码</label>
          <input
            style={styles.input}
            type="password"
            placeholder="原密码"
            value={oldPassword}
            onChange={(e) => setOldPassword(e.target.value)}
          />

          <label style={styles.label}>新密码</label>
          <input
            style={styles.input}
            type="password"
            placeholder="新密码（至少6位）"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />

          <label style={styles.label}>确认新密码</label>
          <input
            style={styles.input}
            type="password"
            placeholder="确认新密码"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />

          {passwordMsg && (
            <p style={{ fontSize: 13, marginTop: 8, color: passwordMsg.startsWith('✅') ? '#7d9a70' : '#c0392b' }}>
              {passwordMsg}
            </p>
          )}
          <button style={{ ...styles.btn, background: '#c06840' }} onClick={handleChangePassword}>
            修改密码
          </button>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  pageTitle: {
    fontFamily: 'var(--font-playfair), serif',
    fontSize: 28,
    color: '#2d1a0e',
    marginBottom: 24,
  },
  twoCol: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 32,
  },
  column: {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 20,
    padding: 28,
    boxShadow: 'var(--shadow-sm)',
  },
  sectionTitle: {
    fontSize: 14,
    color: '#b8a088',
    marginBottom: 16,
    fontWeight: 500,
    fontFamily: 'var(--font-source-sans), sans-serif',
  },
  label: {
    display: 'block',
    fontSize: 13,
    color: '#8a7a6a',
    marginBottom: 6,
    marginTop: 12,
    fontFamily: 'var(--font-source-sans), sans-serif',
  },
  input: {
    width: '100%',
    padding: '10px 14px',
    borderRadius: 10,
    border: '1px solid #e5d5c0',
    fontSize: 14,
    outline: 'none',
    fontFamily: 'var(--font-source-sans), sans-serif',
    boxSizing: 'border-box' as const,
  },
  avatarGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(6, 1fr)',
    gap: 6,
    marginBottom: 8,
  },
  avatarOption: {
    fontSize: 24,
    padding: '6px 0',
    border: '2px solid transparent',
    borderRadius: 12,
    background: '#fdfaf6',
    cursor: 'pointer',
    textAlign: 'center' as const,
  },
  avatarOptionActive: {
    background: '#fef5ee',
    border: '2px solid #c06840',
  },
  btn: {
    width: '100%',
    padding: '12px',
    border: 'none',
    borderRadius: 12,
    background: '#7d9a70',
    color: '#fff',
    fontSize: 15,
    fontWeight: 600,
    cursor: 'pointer',
    marginTop: 14,
    fontFamily: 'var(--font-source-sans), sans-serif',
  },
};
