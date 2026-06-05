'use client';

import { useAuth } from '@/hooks/useAuth';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user) router.push('/login');
  }, [user, loading, router]);

  if (loading) return <div style={{ padding: 40, color: '#b8a088' }}>加载中…</div>;
  if (!user) return null;

  const navActive = (href: string) => pathname === href || pathname?.startsWith(href + '/');

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <aside style={styles.sidebar}>
        <h2 style={styles.logo}>🐱 胖喵后台</h2>
        <nav style={styles.nav}>
          <a href="/dashboard" style={{
            ...styles.navItem,
            ...(navActive('/dashboard') && !navActive('/dashboard/posts') && !navActive('/dashboard/users') ? styles.navItemActive : {}),
          }}>📊 仪表盘</a>
          <a href="/dashboard/posts" style={{
            ...styles.navItem,
            ...(navActive('/dashboard/posts') ? styles.navItemActive : {}),
          }}>📝 内容管理</a>
          <a href="/dashboard/users" style={{
            ...styles.navItem,
            ...(navActive('/dashboard/users') ? styles.navItemActive : {}),
          }}>👥 用户管理</a>
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
    transition: 'all .2s',
  },
  navItemActive: {
    background: 'rgba(255,255,255,.12)',
    color: '#fff',
    fontWeight: 600,
  },
  main: { flex: 1, padding: '32px 40px', overflowY: 'auto', background: '#fdfaf6' },
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
