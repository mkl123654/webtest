'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { GallerySection } from '@/components/GallerySection';
import { api } from '@/lib/api';

interface FavoriteItem {
  id: number;
  postId: number;
  post: {
    id: number;
    title: string;
    description: string;
    emoji: string;
    badge: string;
    section: { id: number; title: string; category: string };
  };
}

const TABS = [
  { key: '', icon: '📋', label: '全部' },
  { key: 'food', icon: '🍽️', label: '美食' },
  { key: 'travel', icon: '✈️', label: '旅游' },
  { key: 'fun', icon: '🎮', label: '游玩' },
];

export function FavoritesContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const category = searchParams.get('category') || '';

  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [loading, setLoading] = useState(true);

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

  return (
    <div className="recommend-content">
      <div className="category-tabs">
        {TABS.map(t => (
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
              category: f.post.section.category,
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
