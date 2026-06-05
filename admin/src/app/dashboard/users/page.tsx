'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';

interface User {
  id: number;
  username: string;
  role: string;
  avatar: string;
  bio: string;
  createdAt: string;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<User[]>('/admin/users')
      .then(setUsers)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ color: '#b8a088', padding: 40 }}>加载中…</div>;

  return (
    <div>
      <h1 style={styles.title}>👥 用户管理</h1>
      <p style={styles.subtitle}>共 {users.length} 位注册用户</p>

      <div style={styles.table}>
        <div style={styles.thead}>
          <div style={{ ...styles.th, width: 60 }}>头像</div>
          <div style={styles.th}>用户名</div>
          <div style={styles.th}>角色</div>
          <div style={styles.th}>个人介绍</div>
          <div style={{ ...styles.th, width: 160 }}>注册时间</div>
        </div>
        {users.map((u) => (
          <div key={u.id} style={styles.tr}>
            <div style={{ ...styles.td, width: 60, fontSize: 28 }}>{u.avatar}</div>
            <div style={{ ...styles.td, fontWeight: 600 }}>{u.username}</div>
            <div style={styles.td}>
              <span style={{
                ...styles.roleBadge,
                background: u.role === 'ADMIN' ? '#fef5ee' : '#fdfaf6',
                color: u.role === 'ADMIN' ? '#c06840' : '#b8a088',
                borderColor: u.role === 'ADMIN' ? '#c06840' : '#e5d5c0',
              }}>
                {u.role === 'ADMIN' ? '👑 管理员' : '🐱 用户'}
              </span>
            </div>
            <div style={{ ...styles.td, color: '#b8a088' }}>{u.bio || '—'}</div>
            <div style={{ ...styles.td, width: 160, fontSize: 12, color: '#b8a088' }}>
              {new Date(u.createdAt).toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        ))}
        {!users.length && (
          <div style={{ textAlign: 'center', padding: 40, color: '#b8a088' }}>暂无用户</div>
        )}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  title: { fontSize: 22, fontWeight: 700, marginBottom: 4, fontFamily: "'Playfair Display', serif" },
  subtitle: { fontSize: 13, color: '#b8a088', marginBottom: 24 },
  table: { background: '#fff', borderRadius: 16, border: '1px solid #e5d5c0', overflow: 'hidden' },
  thead: { display: 'flex', borderBottom: '1px solid #e5d5c0', background: '#fdfaf6' },
  th: {
    flex: 1, padding: '12px 16px', fontSize: 12, color: '#b8a088', fontWeight: 600,
    textAlign: 'left' as const, textTransform: 'uppercase' as const, letterSpacing: 0.5,
  },
  tr: { display: 'flex', borderBottom: '1px solid #f7efe0', alignItems: 'center', transition: 'background .2s' },
  td: { flex: 1, padding: '12px 16px', fontSize: 14, color: '#2d1a0e' },
  roleBadge: {
    display: 'inline-block', padding: '2px 10px', borderRadius: 12, fontSize: 12,
    border: '1px solid',
  },
};
