import { Suspense } from 'react';
import { RecommendContent } from '@/components/RecommendContent';

export default function HomePage() {
  return (
    <Suspense fallback={
      <div style={{ padding: '40px', textAlign: 'center', color: 'var(--taupe)' }}>加载中…</div>
    }>
      <RecommendContent />
    </Suspense>
  );
}
