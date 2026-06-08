'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { LeftPanel } from '@/components/LeftPanel';
import { ChatFloat } from '@/components/ChatFloat';

function MobileTabBar() {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <nav className="mobile-tabbar">
      <button
        className={`mobile-tabbar-item ${pathname === '/' ? 'active' : ''}`}
        onClick={() => router.push('/')}
      >
        <span className="mobile-tabbar-icon">🐱</span>
        <span className="mobile-tabbar-label">推荐</span>
      </button>
      <button
        className={`mobile-tabbar-item ${pathname.startsWith('/favorites') ? 'active' : ''}`}
        onClick={() => router.push('/favorites')}
      >
        <span className="mobile-tabbar-icon">⭐</span>
        <span className="mobile-tabbar-label">收藏</span>
      </button>
      <button
        className={`mobile-tabbar-item ${pathname.startsWith('/settings') ? 'active' : ''}`}
        onClick={() => router.push('/settings')}
      >
        <span className="mobile-tabbar-icon">⚙️</span>
        <span className="mobile-tabbar-label">设置</span>
      </button>
    </nav>
  );
}

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <p style={{ color: '#b8a088', fontSize: 16, fontFamily: 'var(--font-source-sans), sans-serif' }}>加载中…</p>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="app">
      <LeftPanel />
      <main className="right-panel">
        {children}
      </main>
      <ChatFloat />
      <MobileTabBar />
    </div>
  );
}
