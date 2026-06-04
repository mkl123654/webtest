'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { LeftPanel } from '@/components/LeftPanel';
import { RightPanel } from '@/components/RightPanel';
import { ChatFloat } from '@/components/ChatFloat';

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'food' | 'travel' | 'fun'>('food');

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <p style={{ color: '#b8a088', fontSize: 16 }}>加载中…</p>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="app">
      <LeftPanel activeTab={activeTab} onTabChange={setActiveTab} />
      <RightPanel activeTab={activeTab} />
      <ChatFloat />
    </div>
  );
}
