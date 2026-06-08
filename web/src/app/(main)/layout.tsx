'use client';

import { useState, useEffect } from 'react';
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
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Close drawer on route change
  const pathname = usePathname();
  useEffect(() => { setDrawerOpen(false); }, [pathname]);

  // Auth guard
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  // Lock body scroll when drawer open
  useEffect(() => {
    if (drawerOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [drawerOpen]);

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
      {/* Hamburger menu button — visible only on mobile */}
      <button
        className="mobile-menu-btn"
        onClick={() => setDrawerOpen(true)}
        aria-label="打开菜单"
      >
        ☰
      </button>

      {/* Backdrop overlay */}
      <div
        className={`left-panel-overlay ${drawerOpen ? 'show' : ''}`}
        onClick={() => setDrawerOpen(false)}
      />

      {/* Left panel — .open class controls mobile drawer */}
      <LeftPanel onNavigate={() => setDrawerOpen(false)} className={drawerOpen ? 'open' : ''} />

      <main className="right-panel">
        {children}
      </main>
      <ChatFloat />
      <MobileTabBar />
    </div>
  );
}
