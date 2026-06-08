'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';

interface Props {
  badge: string;
  emoji: string;
  name: string;
  desc: string;
  index: number;
  postId: number;
  category: string;
  isFavorited?: boolean;
  favoriteId?: number;
}

export function GalleryCard({ badge, emoji, name, desc, index, postId, category, isFavorited = false, favoriteId }: Props) {
  const [fav, setFav] = useState(isFavorited);
  const [animating, setAnimating] = useState(false);

  const toggleFav = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setAnimating(true);
    try {
      if (fav) {
        await api.del(`/favorites?postId=${postId}`);
        setFav(false);
      } else {
        await api.post('/favorites', { postId });
        setFav(true);
      }
    } catch (err) {
      // silently fail
    }
    setTimeout(() => setAnimating(false), 300);
  }, [fav, postId]);

  return (
    <Link href={`/${category}/${postId}`} className="gallery-card" style={{ textDecoration: 'none', position: 'relative' }}>
      <div className="img">
        <span className="badge">{badge}</span>
        <button
          className={`fav-btn ${fav ? 'active' : ''} ${animating ? 'pop' : ''}`}
          onClick={toggleFav}
          aria-label={fav ? '取消收藏' : '收藏'}
          title={fav ? '取消收藏' : '收藏'}
        >
          {fav ? '❤️' : '♡'}
        </button>
        {emoji}
      </div>
      <div className="caption">
        {name}
        <small>{desc}</small>
      </div>
    </Link>
  );
}
