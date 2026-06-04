'use client';

import { useAuth } from '@/hooks/useAuth';

export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24 }}>👋 欢迎，{user?.username}</h1>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
        <div style={cardStyle}>
          <div style={{ fontSize: 32 }}>📝</div>
          <div style={{ fontSize: 28, fontWeight: 700 }}>0</div>
          <div style={{ color: '#b8a088', fontSize: 13 }}>待审核投稿</div>
        </div>
        <div style={cardStyle}>
          <div style={{ fontSize: 32 }}>✅</div>
          <div style={{ fontSize: 28, fontWeight: 700 }}>0</div>
          <div style={{ color: '#b8a088', fontSize: 13 }}>已发布内容</div>
        </div>
        <div style={cardStyle}>
          <div style={{ fontSize: 32 }}>👥</div>
          <div style={{ fontSize: 28, fontWeight: 700 }}>0</div>
          <div style={{ color: '#b8a088', fontSize: 13 }}>注册用户</div>
        </div>
      </div>
    </div>
  );
}

const cardStyle: React.CSSProperties = {
  background: '#fff',
  borderRadius: 16,
  padding: '24px',
  border: '1px solid #e5d5c0',
  boxShadow: '0 2px 8px rgba(45,26,14,.04)',
};
