'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';

export function LeftPanel() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    if (dropdownOpen) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [dropdownOpen]);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const isActive = (path: string) => {
    if (path === '/') return pathname === '/';
    return pathname.startsWith(path);
  };

  return (
    <aside className="left-panel" id="leftPanel">
      {/* Profile section — unchanged */}
      <div className="profile-section">
        <div className="avatar-wrap" ref={dropdownRef}>
          <div
            className="avatar-main"
            onClick={() => setDropdownOpen(!dropdownOpen)}
            style={{ cursor: 'pointer' }}
          >
            {user?.avatar || '🐱'}
          </div>
          <div className="avatar-status" />

          {dropdownOpen && (
            <div className="avatar-dropdown">
              <div className="dropdown-avatar">{user?.avatar || '🐱'}</div>
              <div className="dropdown-name">{user?.username}</div>
              <div className="dropdown-id">ID: {user?.id}</div>
              <div className="dropdown-bio">{user?.bio || '这个人很懒，什么都没写…'}</div>
              <div className="dropdown-actions">
                <button className="dropdown-btn logout" onClick={handleLogout}>
                  🚪 退出
                </button>
              </div>
            </div>
          )}
        </div>
        <div className="profile-name">{user?.username || '胖喵'}</div>
        <div className="profile-tagline">吃货 · 旅行达人</div>
      </div>

      {/* Nav menu — replaced 3 category tabs with 3 feature links, removed label */}
      <nav className="nav-tabs">
        <Link
          href="/"
          className={`nav-tab ${isActive('/') ? 'active' : ''}`}
          style={{ textDecoration: 'none' }}
        >
          <span className="tab-icon">🐱</span> 胖喵推荐
          <span className="tab-arrow">→</span>
        </Link>
        <Link
          href="/favorites"
          className={`nav-tab ${isActive('/favorites') ? 'active' : ''}`}
          style={{ textDecoration: 'none' }}
        >
          <span className="tab-icon">⭐</span> 个人收藏
          <span className="tab-arrow">→</span>
        </Link>
        <Link
          href="/settings"
          className={`nav-tab ${isActive('/settings') ? 'active' : ''}`}
          style={{ textDecoration: 'none' }}
        >
          <span className="tab-icon">⚙️</span> 个人设置
          <span className="tab-arrow">→</span>
        </Link>
      </nav>
    </aside>
  );
}
