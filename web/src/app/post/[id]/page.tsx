'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';
import Link from 'next/link';

interface PostDetail {
  id: number;
  title: string;
  description: string;
  emoji: string;
  badge: string;
  content: string | null;
  images: string | null;
  ratingAvg: number;
  ratingCount: number;
  categories: { category: { id: number; key: string; label: string; icon: string } }[];
  comments: CommentNode[];
}

interface CommentNode {
  id: number;
  content: string;
  createdAt: string;
  parentId: number | null;
  user: { id: number; username: string; avatar: string };
  replies: CommentNode[];
}


export default function PostDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const [post, setPost] = useState<PostDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Comments
  const [commentText, setCommentText] = useState('');
  const [replyTo, setReplyTo] = useState<{ id: number; username: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Rating
  const [userScore, setUserScore] = useState(0);
  const [hoverScore, setHoverScore] = useState(0);

  const fetchPost = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.get<PostDetail>(`/posts/${params.id}`);
      setPost(data);
    } catch {
      setError('卡片不存在或加载失败');
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => { fetchPost(); }, [fetchPost]);

  // Fetch user's rating
  useEffect(() => {
    if (user && params.id) {
      api.get<{ score: number }>(`/posts/${params.id}/rating`)
        .then((r) => setUserScore(r.score))
        .catch(() => {});
    }
  }, [user, params.id]);

  // ===== Comments =====

  const submitComment = async () => {
    if (!commentText.trim() || !user || submitting) return;
    setSubmitting(true);
    try {
      await api.post(`/posts/${params.id}/comments`, {
        content: commentText.trim(),
        parentId: replyTo?.id || undefined,
      });
      setCommentText('');
      setReplyTo(null);
      fetchPost();
    } catch (err: any) {
      alert(err.message || '评论失败');
    } finally {
      setSubmitting(false);
    }
  };

  const deleteComment = async (commentId: number) => {
    if (!confirm('确定删除这条评论？')) return;
    try {
      await api.del(`/comments/${commentId}`);
      fetchPost();
    } catch (err: any) {
      alert(err.message || '删除失败');
    }
  };

  // ===== Rating =====

  const submitRating = async (score: number) => {
    if (!user) return;
    try {
      const result = await api.post<{ ratingAvg: number; ratingCount: number }>(`/posts/${params.id}/rate`, { score });
      setUserScore(score);
      setPost((prev) => prev ? { ...prev, ratingAvg: result.ratingAvg, ratingCount: result.ratingCount } : prev);
    } catch (err: any) {
      alert(err.message || '评分失败');
    }
  };

  if (loading) return <div style={styles.center}><p style={{ color: '#b8a088' }}>加载中…</p></div>;
  if (error || !post) return <div style={styles.center}><p style={{ color: '#c0392b' }}>{error}</p></div>;

  const imageList: string[] = post.images ? JSON.parse(post.images) : [];

  return (
    <div style={styles.container}>
      <div style={styles.main}>
        {/* 返回 */}
        <button style={styles.backBtn} onClick={() => router.push('/')}>← 返回首页</button>

        {/* 头部信息 */}
        <div style={styles.header}>
          <div style={styles.emoji}>{post.emoji}</div>
          <span style={styles.badge}>{post.badge}</span>
          <h1 style={styles.title}>{post.title}</h1>
          <p style={styles.desc}>{post.description}</p>

          {/* 评分 */}
          <div style={styles.ratingRow}>
            <div style={styles.stars}>
              {[1, 2, 3, 4, 5].map((n) => (
                <span
                  key={n}
                  style={{
                    ...styles.star,
                    color: n <= (hoverScore || userScore) ? '#d49b40' : '#e5d5c0',
                    cursor: user ? 'pointer' : 'default',
                  }}
                  onClick={() => user && submitRating(n)}
                  onMouseEnter={() => setHoverScore(n)}
                  onMouseLeave={() => setHoverScore(0)}
                >
                  ★
                </span>
              ))}
            </div>
            <span style={styles.ratingText}>
              {post.ratingAvg ? `${post.ratingAvg.toFixed(1)} 分` : '暂无评分'}
              {post.ratingCount > 0 && `（${post.ratingCount} 人评价）`}
            </span>
          </div>

          <div style={styles.meta}>
            {post.categories?.map(({ category: c }) => (
              <Link key={c.id} href={`/?categories=${c.key}`} style={styles.categoryLink}>
                {c.icon} {c.label}
              </Link>
            ))}
          </div>
        </div>

        {/* 图片 */}
        {imageList.length > 0 && (
          <div style={styles.imageGrid}>
            {imageList.map((url, i) => (
              <img key={i} src={url} alt={`${post.title} ${i + 1}`} style={styles.image} />
            ))}
          </div>
        )}

        {/* 正文 */}
        {post.content && (
          <div style={styles.content}>
            {post.content.split('\n').map((line, i) => (
              <p key={i} style={styles.paragraph}>{line}</p>
            ))}
          </div>
        )}

        <hr style={styles.divider} />

        {/* ===== 评论区 ===== */}
        <h2 style={styles.sectionTitle}>💬 评论（{post.comments.length}）</h2>

        {user ? (
          <div style={styles.commentForm}>
            {replyTo && (
              <div style={styles.replyHint}>
                回复 <strong>{replyTo.username}</strong>：
                <button style={styles.cancelReply} onClick={() => setReplyTo(null)}>取消</button>
              </div>
            )}
            <textarea
              style={styles.textarea}
              placeholder={replyTo ? `回复 ${replyTo.username}…` : '写下你的评论…'}
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              maxLength={500}
              rows={3}
            />
            <button style={styles.submitBtn} onClick={submitComment} disabled={submitting || !commentText.trim()}>
              {submitting ? '发送中…' : '发表评论'}
            </button>
          </div>
        ) : (
          <p style={styles.loginHint}>
            <Link href="/login" style={{ color: '#c06840' }}>登录</Link>后即可评论和评分
          </p>
        )}

        <div style={styles.commentList}>
          {post.comments.map((c) => (
            <CommentItem key={c.id} comment={c} depth={0} currentUserId={user?.id} onReply={(id, name) => setReplyTo({ id, username: name })} onDelete={deleteComment} />
          ))}
          {!post.comments.length && <p style={{ color: '#b8a088', fontSize: 13 }}>暂无评论，来说两句吧</p>}
        </div>
      </div>
    </div>
  );
}

// ===== 递归评论组件 =====

function CommentItem({
  comment, depth, currentUserId, onReply, onDelete,
}: {
  comment: CommentNode;
  depth: number;
  currentUserId?: number;
  onReply: (id: number, username: string) => void;
  onDelete: (id: number) => void;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const maxDepth = 6;

  return (
    <div style={{ marginLeft: depth > 0 ? 32 : 0 }}>
      <div style={{ ...styles.commentCard, borderLeft: depth > 0 ? '3px solid #e5d5c0' : 'none' }}>
        <div style={styles.commentHeader}>
          <span style={styles.commentAvatar}>{comment.user.avatar}</span>
          <span style={styles.commentUser}>{comment.user.username}</span>
          <span style={styles.commentTime}>
            {new Date(comment.createdAt).toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
        <p style={styles.commentContent}>{comment.content}</p>
        <div style={styles.commentActions}>
          {currentUserId && depth < maxDepth && (
            <button style={styles.commentBtn} onClick={() => onReply(comment.id, comment.user.username)}>回复</button>
          )}
          {currentUserId === comment.user.id && (
            <button style={styles.commentBtnDanger} onClick={() => onDelete(comment.id)}>删除</button>
          )}
        </div>
      </div>

      {/* Replies */}
      {comment.replies.length > 0 && (
        <>
          {collapsed ? (
            <button style={styles.expandBtn} onClick={() => setCollapsed(false)}>
              展开 {comment.replies.length} 条回复 ↓
            </button>
          ) : (
            <>
              {depth >= maxDepth - 1 && (
                <button style={styles.expandBtn} onClick={() => setCollapsed(true)}>
                  收起回复 ↑
                </button>
              )}
              {comment.replies.map((r) => (
                <CommentItem key={r.id} comment={r} depth={depth + 1} currentUserId={currentUserId} onReply={onReply} onDelete={onDelete} />
              ))}
            </>
          )}
        </>
      )}
    </div>
  );
}

// ===== Styles =====

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(145deg, #fdfaf4, #f7efe0)',
    padding: '24px 20px 60px',
    fontFamily: "var(--font-source-sans), sans-serif",
  },
  main: {
    maxWidth: 720,
    margin: '0 auto',
    background: '#fff',
    borderRadius: 24,
    padding: '40px 48px',
    boxShadow: '0 20px 60px rgba(45,26,14,.1)',
  },
  center: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backBtn: {
    background: 'none', border: 'none', color: '#b8a088', cursor: 'pointer',
    fontSize: 14, padding: 0, marginBottom: 24,
    fontFamily: "var(--font-source-sans), sans-serif",
  },
  header: { textAlign: 'center' as const, marginBottom: 32 },
  emoji: { fontSize: 80, marginBottom: 12 },
  badge: {
    display: 'inline-block', padding: '4px 14px', borderRadius: 14,
    background: 'rgba(45,26,14,.6)', color: '#fff', fontSize: 12, marginBottom: 16,
  },
  title: {
    fontFamily: "var(--font-playfair), serif", fontSize: 32, fontWeight: 700,
    color: '#2d1a0e', marginBottom: 8,
  },
  desc: { fontSize: 16, color: '#b8a088' },
  ratingRow: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 16 },
  stars: { display: 'flex', gap: 2 },
  star: { fontSize: 28, transition: 'color .15s' },
  ratingText: { fontSize: 14, color: '#b8a088' },
  meta: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginTop: 16 },
  categoryLink: { color: '#c06840', textDecoration: 'none', fontSize: 14 },
  sectionTag: {
    padding: '2px 10px', borderRadius: 10, background: '#fdfaf6',
    border: '1px solid #e5d5c0', fontSize: 12, color: '#b8a088',
  },
  imageGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12, marginBottom: 32 },
  image: { width: '100%', borderRadius: 12, objectFit: 'cover', aspectRatio: '4/3' },
  content: { marginBottom: 24 },
  paragraph: { fontSize: 16, lineHeight: 1.8, color: '#2d1a0e', marginBottom: 12 },
  divider: { border: 'none', borderTop: '1px solid #e5d5c0', margin: '32px 0' },
  sectionTitle: {
    fontFamily: "var(--font-playfair), serif", fontSize: 20, fontWeight: 600,
    color: '#2d1a0e', marginBottom: 20,
  },
  // Comments
  commentForm: { marginBottom: 24 },
  replyHint: { fontSize: 13, color: '#b8a088', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 },
  cancelReply: {
    background: 'none', border: 'none', color: '#c0392b', cursor: 'pointer', fontSize: 12,
    fontFamily: "var(--font-source-sans), sans-serif",
  },
  textarea: {
    width: '100%', padding: '12px 14px', borderRadius: 12, border: '1px solid #e5d5c0',
    fontSize: 14, outline: 'none', resize: 'vertical' as const, minHeight: 80,
    fontFamily: "var(--font-source-sans), sans-serif", boxSizing: 'border-box' as const,
  },
  submitBtn: {
    marginTop: 8, padding: '8px 20px', borderRadius: 10, border: 'none',
    background: '#c06840', color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer',
    fontFamily: "var(--font-source-sans), sans-serif",
  },
  loginHint: { textAlign: 'center' as const, fontSize: 14, color: '#b8a088', marginBottom: 24 },
  commentList: { display: 'flex', flexDirection: 'column', gap: 4 },
  commentCard: {
    background: '#fdfaf6', borderRadius: 12, padding: '14px 16px', marginBottom: 8,
  },
  commentHeader: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 },
  commentAvatar: { fontSize: 20 },
  commentUser: { fontSize: 13, fontWeight: 600, color: '#2d1a0e' },
  commentTime: { fontSize: 11, color: '#b8a088', marginLeft: 'auto' },
  commentContent: { fontSize: 14, color: '#2d1a0e', lineHeight: 1.6, marginBottom: 8 },
  commentActions: { display: 'flex', gap: 10 },
  commentBtn: {
    background: 'none', border: 'none', color: '#b8a088', cursor: 'pointer',
    fontSize: 12, padding: 0, fontFamily: "var(--font-source-sans), sans-serif",
  },
  commentBtnDanger: {
    background: 'none', border: 'none', color: '#c0392b', cursor: 'pointer',
    fontSize: 12, padding: 0, fontFamily: "var(--font-source-sans), sans-serif",
  },
  expandBtn: {
    background: 'none', border: 'none', color: '#c06840', cursor: 'pointer',
    fontSize: 12, marginLeft: 32, marginBottom: 8, fontFamily: "var(--font-source-sans), sans-serif",
  },
};
