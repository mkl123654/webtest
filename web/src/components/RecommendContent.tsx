'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { GallerySection } from './GallerySection';
import { api } from '@/lib/api';
import type { CategoryGroupData } from '@/types';

interface PostItem {
  id: number;
  title: string;
  description: string;
  emoji: string;
  badge: string;
  published: boolean;
  sortOrder: number;
  categories?: { category: { id: number; key: string; label: string; group: { key: string; label: string } } }[];
}

interface TabItem {
  key: string;
  icon: string;
  label: string;
}

export function RecommendContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const categoriesParam = searchParams.get('categories') || 'food';

  const [tabs, setTabs] = useState<TabItem[]>([]);
  const [posts, setPosts] = useState<PostItem[]>([]);
  const [searchInput, setSearchInput] = useState('');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [searchResults, setSearchResults] = useState<PostItem[]>([]);

  // Load categories for TABS
  useEffect(() => {
    api.get<CategoryGroupData[]>('/categories')
      .then((groups) => {
        const flat: TabItem[] = [];
        for (const g of groups) for (const c of g.categories) flat.push({ key: c.key, icon: c.icon, label: c.label });
        setTabs(flat);
      })
      .catch(() => setTabs([]));
  }, []);

  // Load posts for selected category
  useEffect(() => {
    if (searchKeyword) return;
    api.get<PostItem[]>(`/posts?category=${categoriesParam}`)
      .then(setPosts)
      .catch(() => setPosts([]));
  }, [categoriesParam, searchKeyword]);

  const switchTab = useCallback((key: string) => {
    setSearchInput('');
    setSearchKeyword('');
    setSearchResults([]);
    router.push(`/?categories=${key}`, { scroll: false });
  }, [router]);

  const handleSearch = () => {
    const q = searchInput.trim();
    if (!q) return;
    setSearchKeyword(q);
    const params = new URLSearchParams({ q });
    if (categoriesParam !== 'food') params.set('category', categoriesParam);
    api.get<PostItem[]>(`/search?${params}`)
      .then(setSearchResults)
      .catch(() => setSearchResults([]));
  };

  const handleClear = () => { setSearchInput(''); setSearchKeyword(''); setSearchResults([]); };
  const handleKeyDown = (e: React.KeyboardEvent) => { if (e.key === 'Enter') handleSearch(); };

  const getPostCategory = (p: PostItem): string => p.categories?.[0]?.category?.key || '';

  const toGalleryItem = (p: PostItem) => ({
    badge: p.badge, emoji: p.emoji, name: p.title, desc: p.description,
    postId: p.id, category: getPostCategory(p),
  });

  return (
    <div className="recommend-content">
      <div className="recommend-search">
        <div className="tab-search" style={{ maxWidth: 640, margin: '0 auto' }}>
          <input type="text" className="tab-search-input" placeholder="搜美食、饮品、目的地、玩法…" maxLength={200}
            value={searchInput} onChange={(e) => setSearchInput(e.target.value)} onKeyDown={handleKeyDown} />
          <button className="tab-search-btn" onClick={handleSearch}>搜索</button>
          {searchKeyword && (
            <button className="tab-search-btn" onClick={handleClear} style={{ background: 'var(--taupe)' }}>清除</button>
          )}
        </div>
      </div>

      <div className="category-tabs">
        {tabs.map(t => (
          <button key={t.key} className={`category-tab ${categoriesParam === t.key ? 'active' : ''}`} onClick={() => switchTab(t.key)}>
            <span className="category-tab-icon">{t.icon}</span>{t.label}
          </button>
        ))}
      </div>

      <div className="recommend-body">
        {searchKeyword ? (
          searchResults.length > 0 ? (
            <GallerySection title={`🔍 搜索结果："${searchKeyword}"（${searchResults.length} 个）`} items={searchResults.map(toGalleryItem)} />
          ) : (
            <p style={{ textAlign: 'center', color: 'var(--taupe)', marginTop: 40, fontSize: 14 }}>
              没有找到与 &quot;{searchKeyword}&quot; 相关的内容
            </p>
          )
        ) : (
          <GallerySection title="推荐" items={posts.map(toGalleryItem)} />
        )}
        {!searchKeyword && <footer className="footer">&copy; 2026 胖喵 · 前端开发者</footer>}
      </div>
    </div>
  );
}
