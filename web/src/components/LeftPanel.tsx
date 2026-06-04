'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

interface Props {
  activeTab: 'food' | 'travel' | 'fun';
  onTabChange: (tab: 'food' | 'travel' | 'fun') => void;
}

export function LeftPanel({ activeTab, onTabChange }: Props) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 点击外部关闭下拉
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

  return (
    <aside className="left-panel" id="leftPanel">
      {/* 个人信息 */}
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

          {/* 下拉卡片 */}
          {dropdownOpen && (
            <div className="avatar-dropdown">
              <div className="dropdown-avatar">{user?.avatar || '🐱'}</div>
              <div className="dropdown-name">{user?.username}</div>
              <div className="dropdown-id">ID: {user?.id}</div>
              <div className="dropdown-bio">{user?.bio || '这个人很懒，什么都没写…'}</div>
              <div className="dropdown-actions">
                <button
                  className="dropdown-btn settings"
                  onClick={() => {
                    setDropdownOpen(false);
                    router.push('/settings');
                  }}
                >
                  ⚙️ 设置
                </button>
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

      {/* 导航Tab */}
      <nav className="nav-tabs">
        <div className="nav-tabs-label">📂 推荐分类</div>
        <button
          className={`nav-tab ${activeTab === 'food' ? 'active' : ''}`}
          onClick={() => onTabChange('food')}
        >
          <span className="tab-icon">🍽️</span> 美食推荐
          <span className="tab-arrow">→</span>
        </button>
        <button
          className={`nav-tab ${activeTab === 'travel' ? 'active' : ''}`}
          onClick={() => onTabChange('travel')}
        >
          <span className="tab-icon">✈️</span> 旅游推荐
          <span className="tab-arrow">→</span>
        </button>
        <button
          className={`nav-tab ${activeTab === 'fun' ? 'active' : ''}`}
          onClick={() => onTabChange('fun')}
        >
          <span className="tab-icon">🎮</span> 游玩推荐
          <span className="tab-arrow">→</span>
        </button>
      </nav>
    </aside>
  );
}
