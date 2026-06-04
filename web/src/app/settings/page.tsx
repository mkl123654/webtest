'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';

const AVATAR_OPTIONS = ['🐱', '🐶', '🐰', '🦊', '🐼', '🐨', '🐯', '🐸', '🐵', '🐤', '🦄', '🐙'];

export default function SettingsPage() {
  const { user, loading, logout, refreshUser } = useAuth();
  const router = useRouter();

  const [avatar, setAvatar] = useState(user?.avatar || '🐱');
  const [username, setUsername] = useState(user?.username || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [profileMsg, setProfileMsg] = useState('');

  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMsg, setPasswordMsg] = useState('');

  useEffect(() => {
    if (!loading && !user) router.push('/login');
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      setAvatar(user.avatar);
      setUsername(user.username);
      setBio(user.bio);
    }
  }, [user]);

  if (loading) return null;
  if (!user) return null;

  const handleSaveProfile = async () => {
    setProfileMsg('');
    if (!username.trim()) { setProfileMsg('用户名不能为空'); return; }

    try {
      const updated = await api.put<{ username: string; avatar: string; bio: string }>(
        '/users/me',
        { username: username.trim(), avatar, bio: bio.trim() },
      );
      setProfileMsg('✅ 保存成功');
      refreshUser();
    } catch (err: any) {
      setProfileMsg(`❌ ${err.message || '保存失败'}`);
    }
  };

  const handleChangePassword = async () => {
    setPasswordMsg('');
    if (!oldPassword) { setPasswordMsg('请输入原密码'); return; }
    if (newPassword.length < 6) { setPasswordMsg('新密码至少6位'); return; }
    if (newPassword !== confirmPassword) { setPasswordMsg('两次新密码不一致'); return; }

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

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <button style={styles.backBtn} onClick={() => router.push('/')}>← 返回首页</button>
        <h1 style={styles.title}>⚙️ 账号设置</h1>

        {/* 头像 */}
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>头像</h3>
          <div style={styles.avatarPreview}>{avatar}</div>
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
        </div>

        {/* 用户名 */}
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>用户名</h3>
          <input
            style={styles.input}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            maxLength={50}
          />
        </div>

        {/* 介绍 */}
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>个人介绍</h3>
          <textarea
            style={{ ...styles.input, height: 80, resize: 'vertical' }}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            maxLength={200}
            placeholder="介绍一下自己…"
          />
        </div>

        {profileMsg && (
          <p style={{ ...styles.msg, color: profileMsg.startsWith('✅') ? '#7d9a70' : '#c0392b' }}>
            {profileMsg}
          </p>
        )}
        <button style={styles.btn} onClick={handleSaveProfile}>保存资料</button>

        <hr style={styles.divider} />

        {/* 改密码 */}
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>修改密码</h3>
          <input
            style={styles.input}
            type="password"
            placeholder="原密码"
            value={oldPassword}
            onChange={(e) => setOldPassword(e.target.value)}
          />
          <input
            style={styles.input}
            type="password"
            placeholder="新密码（至少6位）"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
          <input
            style={styles.input}
            type="password"
            placeholder="确认新密码"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
        </div>

        {passwordMsg && (
          <p style={{ ...styles.msg, color: passwordMsg.startsWith('✅') ? '#7d9a70' : '#c0392b' }}>
            {passwordMsg}
          </p>
        )}
        <button style={{ ...styles.btn, background: '#c06840' }} onClick={handleChangePassword}>
          修改密码
        </button>

        <hr style={styles.divider} />

        <button style={styles.logoutBtn} onClick={handleLogout}>🚪 退出登录</button>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(145deg, #fdfaf4, #f7efe0)',
    fontFamily: "var(--font-source-sans), sans-serif",
    padding: '20px',
  },
  card: {
    background: '#fff',
    borderRadius: 24,
    padding: '40px',
    width: 480,
    maxWidth: '90vw',
    boxShadow: '0 20px 60px rgba(45,26,14,.12)',
  },
  backBtn: {
    background: 'none',
    border: 'none',
    color: '#b8a088',
    cursor: 'pointer',
    fontSize: 14,
    padding: 0,
    marginBottom: 12,
    fontFamily: "var(--font-source-sans), sans-serif",
  },
  title: {
    fontFamily: "var(--font-playfair), serif",
    fontSize: 28,
    color: '#2d1a0e',
    marginBottom: 28,
  },
  section: {
    marginBottom: 18,
  },
  sectionTitle: {
    fontSize: 14,
    color: '#b8a088',
    marginBottom: 10,
    fontWeight: 500,
  },
  avatarPreview: {
    fontSize: 56,
    textAlign: 'center' as const,
    marginBottom: 14,
  },
  avatarGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(6, 1fr)',
    gap: 8,
  },
  avatarOption: {
    fontSize: 28,
    padding: '8px 0',
    border: '2px solid transparent',
    borderRadius: 12,
    background: '#fdfaf6',
    cursor: 'pointer',
    textAlign: 'center' as const,
    transition: 'all .2s',
  },
  avatarOptionActive: {
    borderColor: '#c06840',
    background: '#fef5ee',
  },
  input: {
    width: '100%',
    padding: '10px 14px',
    borderRadius: 10,
    border: '1px solid #e5d5c0',
    fontSize: 14,
    outline: 'none',
    fontFamily: "var(--font-source-sans), sans-serif",
    marginBottom: 8,
    boxSizing: 'border-box' as const,
  },
  msg: {
    fontSize: 13,
    marginBottom: 12,
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
    fontFamily: "var(--font-source-sans), sans-serif",
  },
  divider: {
    border: 'none',
    borderTop: '1px solid #e5d5c0',
    margin: '28px 0',
  },
  logoutBtn: {
    width: '100%',
    padding: '12px',
    border: '1px solid #ef4444',
    borderRadius: 12,
    background: '#fff',
    color: '#ef4444',
    fontSize: 15,
    cursor: 'pointer',
    fontFamily: "var(--font-source-sans), sans-serif",
  },
};
