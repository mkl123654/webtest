import { Suspense } from 'react';
import { FavoritesContent } from './FavoritesContent';

export default function FavoritesPage() {
  return (
    <Suspense fallback={
      <div style={{ padding: '40px', textAlign: 'center', color: 'var(--taupe)' }}>加载中…</div>
    }>
      <FavoritesContent />
    </Suspense>
  );
}
