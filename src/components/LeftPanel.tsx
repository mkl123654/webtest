'use client';

import { useState } from 'react';

interface Props {
  activeTab: 'food' | 'travel' | 'fun';
  onTabChange: (tab: 'food' | 'travel' | 'fun') => void;
}

export function LeftPanel({ activeTab, onTabChange }: Props) {
  const [infoOpen, setInfoOpen] = useState(true);

  return (
    <aside className="left-panel" id="leftPanel">
      {/* 个人信息 */}
      <div className="profile-section">
        <div className="avatar-wrap">
          <div className="avatar-main">🐱</div>
          <div className="avatar-status" />
        </div>
        <div className="profile-name">胖喵</div>
        <div className="profile-tagline">前端开发者 · AI 数字分身</div>
        <span
          className="profile-hint"
          onClick={() => setInfoOpen(!infoOpen)}
        >
          {infoOpen ? '▴ 收起信息' : '▾ 更多信息'}
        </span>

        <div className={`profile-info-wrap ${infoOpen ? 'open' : ''}`}>
          <div className="profile-info-grid">
            <div className="info-chip">
              <div className="label">身份</div>
              <div className="value">前端开发者 · 页面构建</div>
            </div>
            <div className="info-chip">
              <div className="label">状态</div>
              <div className="value">🟢 在线，AI 驱动中</div>
            </div>
            <div className="info-chip">
              <div className="label">技术方向</div>
              <div className="value">HTML · CSS · JavaScript</div>
            </div>
            <div className="info-chip">
              <div className="label">联系方式</div>
              <div className="value">hello@pangmiao.dev</div>
            </div>
          </div>
        </div>
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
