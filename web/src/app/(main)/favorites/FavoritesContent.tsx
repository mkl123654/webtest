'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { GallerySection } from '@/components/GallerySection';
import { api } from '@/lib/api';
import type { CategoryGroupData } from '@/types';

interface FavoriteItem {
  id: number;
  postId: number;
  post: {
    id: number;
    title: string;
    description: string;
    emoji: string;
    badge: string;
    categories: { category: { id: number; key: string; label: string; group: { key: string; label: string } } }[];
  };
}

interface TabItem {
  key: string;
  icon: string;
  label: string;
}

export function FavoritesContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const category = searchParams.get('category') || '';

  const [tabs, setTabs] = useState<TabItem[]>([]);
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Load categories for TABS
  useEffect(() => {
    api.get<CategoryGroupData[]>('/categories')
      .then((groups) => {
        const flat: TabItem[] = [{ key: '', icon: '📋', label: '全部' }];
        for (const g of groups) {
          for (const c of g.categories) {
            flat.push({ key: c.key, icon: c.icon, label: c.label });
          }
        }
        setTabs(flat);
      })
      .catch(() => setTabs([]));
  }, []);

  const fetchFavorites = useCallback(() => {
    setLoading(true);
    const query = category ? `?category=${category}` : '';
    api.get<FavoriteItem[]>(`/favorites${query}`)
      .then(setFavorites)
      .catch(() => setFavorites([]))
      .finally(() => setLoading(false));
  }, [category]);

  useEffect(() => {
    fetchFavorites();
  }, [fetchFavorites]);

  const switchTab = (key: string) => {
    router.push(key ? `/favorites?category=${key}` : '/favorites', { scroll: false });
  };

  const getPostCategory = (f: FavoriteItem): string => {
    return f.post.categories?.[0]?.category?.key || '';
  };

  return (
    <div className="recommend-content">
      <div className="category-tabs">
        {tabs.map(t => (
          <button
            key={t.key}
            className={`category-tab ${category === t.key ? 'active' : ''}`}
            onClick={() => switchTab(t.key)}
          >
            <span className="category-tab-icon">{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>

      <div className="recommend-body">
        {loading ? (
          <p style={{ textAlign: 'center', color: 'var(--taupe)', marginTop: 40, fontSize: 14 }}>加载中…</p>
        ) : favorites.length > 0 ? (
          <GallerySection
            title={`⭐ 我的收藏（${favorites.length}）`}
            items={favorites.map(f => ({
              badge: f.post.badge,
              emoji: f.post.emoji,
              name: f.post.title,
              desc: f.post.description,
              postId: f.post.id,
              category: getPostCategory(f),
              isFavorited: true,
              favoriteId: f.id,
            }))}
          />
        ) : (
          <div style={{ textAlign: 'center', marginTop: 60 }}>
            <p style={{ fontSize: 48, marginBottom: 16 }}>⭐</p>
            <p style={{ color: 'var(--taupe)', fontSize: 15 }}>还没有收藏，去首页看看吧</p>
          </div>
        )}
      </div>
    </div>
  );
}
