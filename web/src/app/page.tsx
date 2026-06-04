'use client';

import { useState } from 'react';
import { LeftPanel } from '@/components/LeftPanel';
import { RightPanel } from '@/components/RightPanel';
import { ChatFloat } from '@/components/ChatFloat';

export default function Home() {
  const [activeTab, setActiveTab] = useState<'food' | 'travel' | 'fun'>('food');

  return (
    <div className="app">
      <LeftPanel activeTab={activeTab} onTabChange={setActiveTab} />
      <RightPanel activeTab={activeTab} />
      <ChatFloat />
    </div>
  );
}
