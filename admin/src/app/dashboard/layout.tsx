'use client';

import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.push('/login');
  }, [user, loading, router]);

  if (loading) return <div style={{ padding: 40, color: '#b8a088' }}>加载中…</div>;
  if (!user) return null;

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <aside style={styles.sidebar}>
        <h2 style={styles.logo}>🐱 胖喵后台</h2>
        <nav style={styles.nav}>
          <a href="/dashboard" style={styles.navItem}>📊 仪表盘</a>
          <a href="/posts" style={{ ...styles.navItem, opacity: 0.5, cursor: 'default' }}>📝 内容审核（开发中）</a>
          <a href="/users" style={{ ...styles.navItem, opacity: 0.5, cursor: 'default' }}>👥 用户管理（开发中）</a>
        </nav>
        <button
          onClick={() => { logout(); router.push('/login'); }}
          style={styles.logoutBtn}
        >
          退出登录
        </button>
      </aside>
      <main style={styles.main}>{children}</main>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  sidebar: {
    width: 240,
    background: '#2d1a0e',
    color: '#fff',
    display: 'flex',
    flexDirection: 'column',
    padding: '24px 0',
    flexShrink: 0,
  },
  logo: { padding: '0 20px', marginBottom: 32, fontSize: 20, fontFamily: "'Playfair Display', serif" },
  nav: { display: 'flex', flexDirection: 'column', gap: 4, padding: '0 12px', flex: 1 },
  navItem: {
    padding: '10px 16px',
    borderRadius: 10,
    color: '#e5d5c0',
    textDecoration: 'none',
    fontSize: 14,
  },
  main: { flex: 1, padding: '32px 40px', overflowY: 'auto' },
  logoutBtn: {
    margin: '12px',
    padding: '8px 16px',
    borderRadius: 8,
    background: 'rgba(255,255,255,.1)',
    color: '#fff',
    border: 'none',
    cursor: 'pointer',
    fontSize: 13,
    fontFamily: "'Source Sans 3', sans-serif",
  },
};
