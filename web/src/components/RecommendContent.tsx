'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { GallerySection } from './GallerySection';
import { api } from '@/lib/api';

interface PostItem {
  id: number;
  title: string;
  description: string;
  emoji: string;
  badge: string;
  published: boolean;
  sortOrder: number;
  sectionId: number;
  section?: { id: number; title: string; category: string };
}

interface SectionData {
  id: number;
  title: string;
  category: string;
  sortOrder: number;
  posts: PostItem[];
}

const TABS = [
  { key: 'food', icon: '🍽️', label: '美食推荐' },
  { key: 'travel', icon: '✈️', label: '旅游推荐' },
  { key: 'fun', icon: '🎮', label: '游玩推荐' },
] as const;

export function RecommendContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tab = (searchParams.get('tab') as 'food' | 'travel' | 'fun') || 'food';

  const [sections, setSections] = useState<SectionData[]>([]);
  const [searchInput, setSearchInput] = useState('');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [searchResults, setSearchResults] = useState<PostItem[]>([]);

  // Load sections for current tab
  useEffect(() => {
    if (searchKeyword) return;
    api.get<SectionData[]>(`/sections?category=${tab}`)
      .then(setSections)
      .catch(() => setSections([]));
  }, [tab, searchKeyword]);

  // Switch tab
  const switchTab = useCallback((key: string) => {
    setSearchInput('');
    setSearchKeyword('');
    setSearchResults([]);
    router.push(`/?tab=${key}`, { scroll: false });
  }, [router]);

  // Search
  const handleSearch = () => {
    const q = searchInput.trim();
    if (!q) return;
    setSearchKeyword(q);
    api.get<PostItem[]>(`/search?q=${encodeURIComponent(q)}`)
      .then(setSearchResults)
      .catch(() => setSearchResults([]));
  };

  const handleClear = () => {
    setSearchInput('');
    setSearchKeyword('');
    setSearchResults([]);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
  };

  return (
    <div className="recommend-content">
      {/* Search bar — top */}
      <div className="recommend-search">
        <div className="tab-search" style={{ maxWidth: 640, margin: '0 auto' }}>
          <input
            type="text"
            className="tab-search-input"
            placeholder="搜美食、饮品、目的地、玩法…"
            maxLength={200}
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <button className="tab-search-btn" onClick={handleSearch}>搜索</button>
          {searchKeyword && (
            <button className="tab-search-btn" onClick={handleClear} style={{ background: 'var(--taupe)' }}>
              清除
            </button>
          )}
        </div>
      </div>

      {/* Category tabs */}
      <div className="category-tabs">
        {TABS.map(t => (
          <button
            key={t.key}
            className={`category-tab ${tab === t.key ? 'active' : ''}`}
            onClick={() => switchTab(t.key)}
          >
            <span className="category-tab-icon">{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>

      {/* Content area */}
      <div className="recommend-body">
        {searchKeyword ? (
          searchResults.length > 0 ? (
            <GallerySection
              title={`🔍 搜索结果："${searchKeyword}"（${searchResults.length} 个）`}
              items={searchResults.map(p => ({
                badge: p.badge,
                emoji: p.emoji,
                name: p.title,
                desc: p.description,
                postId: p.id,
                category: p.section?.category || '',
              }))}
            />
          ) : (
            <p style={{ textAlign: 'center', color: 'var(--taupe)', marginTop: 40, fontSize: 14 }}>
              没有找到与 &quot;{searchKeyword}&quot; 相关的内容，换个关键词试试
            </p>
          )
        ) : (
          sections.map((section) => (
            <GallerySection
              key={section.id}
              title={section.title}
              items={section.posts.map((p) => ({
                badge: p.badge,
                emoji: p.emoji,
                name: p.title,
                desc: p.description,
                postId: p.id,
                category: section.category,
              }))}
            />
          ))
        )}

        {!searchKeyword && (
          <footer className="footer">
            &copy; 2026 胖喵 · 前端开发者
          </footer>
        )}
      </div>
    </div>
  );
}
