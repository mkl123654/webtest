'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';

interface Section {
  id: number;
  title: string;
  category: string;
  sortOrder: number;
  posts: Post[];
}

interface Post {
  id: number;
  title: string;
  description: string;
  emoji: string;
  badge: string;
  content?: string | null;
  images?: string | null;
  published: boolean;
  sortOrder: number;
  sectionId: number;
  section?: Section;
}

type Category = '' | 'food' | 'travel' | 'fun';
const CATEGORIES: { value: Category; label: string }[] = [
  { value: '', label: '全部' },
  { value: 'food', label: '🍽️ 美食' },
  { value: 'travel', label: '✈️ 旅游' },
  { value: 'fun', label: '🎮 游玩' },
];

export default function PostsPage() {
  const [sections, setSections] = useState<Section[]>([]);
  const [allPosts, setAllPosts] = useState<Post[]>([]);
  const [category, setCategory] = useState<Category>('');
  const [loading, setLoading] = useState(true);

  // Modal states
  const [postModal, setPostModal] = useState<{ open: boolean; post?: Post; sectionId?: number }>({ open: false });
  const [sectionModal, setSectionModal] = useState<{ open: boolean; section?: Section }>({ open: false });

  // Form states
  const [form, setForm] = useState({
    title: '', description: '', emoji: '🍽️', badge: '推荐', sectionId: 0, published: true, sortOrder: 0,
    content: '', images: '[]',
  });
  const [sectionForm, setSectionForm] = useState({ title: '', category: 'food' as string, sortOrder: 0 });
  const [uploading, setUploading] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [secRes, postRes] = await Promise.all([
        api.get<Section[]>(`/sections${category ? `?category=${category}` : ''}`),
        api.get<Post[]>(`/admin/posts${category ? `?category=${category}` : ''}`),
      ]);
      setSections(secRes);
      setAllPosts(postRes);
    } catch (err) {
      console.error('获取数据失败', err);
    } finally {
      setLoading(false);
    }
  }, [category]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ===== Post handlers =====
  const openCreatePost = (sectionId?: number) => {
    setForm({ title: '', description: '', emoji: '🍽️', badge: '推荐', sectionId: sectionId || sections[0]?.id || 0, published: true, sortOrder: 0, content: '', images: '[]' });
    setPostModal({ open: true, sectionId });
  };

  const openEditPost = (post: Post) => {
    setForm({ title: post.title, description: post.description, emoji: post.emoji, badge: post.badge, sectionId: post.sectionId, published: post.published, sortOrder: post.sortOrder, content: post.content || '', images: post.images || '[]' });
    setPostModal({ open: true, post });
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const token = localStorage.getItem('token');
      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: fd,
      });
      if (!res.ok) throw new Error('上传失败');
      const data = await res.json();
      const current = JSON.parse(form.images || '[]');
      setForm({ ...form, images: JSON.stringify([...current, data.url]) });
    } catch (err: any) {
      alert(err.message || '上传失败');
    } finally {
      setUploading(false);
    }
  };

  const savePost = async () => {
    if (!form.title || !form.description || !form.sectionId) return;
    try {
      if (postModal.post) {
        await api.put(`/admin/posts/${postModal.post.id}`, form);
      } else {
        await api.post('/admin/posts', form);
      }
      setPostModal({ open: false });
      fetchData();
    } catch (err: any) {
      alert(err.message || '保存失败');
    }
  };

  const togglePublish = async (post: Post) => {
    try {
      await api.patch(`/admin/posts/${post.id}/toggle`);
      fetchData();
    } catch (err: any) {
      alert(err.message || '操作失败');
    }
  };

  const deletePost = async (post: Post) => {
    if (!confirm(`确定删除「${post.title}」？`)) return;
    try {
      await api.del(`/admin/posts/${post.id}`);
      fetchData();
    } catch (err: any) {
      alert(err.message || '删除失败');
    }
  };

  const movePost = async (post: Post, direction: 1 | -1) => {
    try {
      await api.put(`/admin/posts/${post.id}`, { sortOrder: post.sortOrder + direction });
      fetchData();
    } catch (err: any) {
      alert(err.message || '移动失败');
    }
  };

  // ===== Section handlers =====
  const openCreateSection = () => {
    setSectionForm({ title: '', category: 'food', sortOrder: 0 });
    setSectionModal({ open: true });
  };

  const openEditSection = (section: Section) => {
    setSectionForm({ title: section.title, category: section.category, sortOrder: section.sortOrder });
    setSectionModal({ open: true, section });
  };

  const saveSection = async () => {
    if (!sectionForm.title) return;
    try {
      if (sectionModal.section) {
        await api.put(`/admin/sections/${sectionModal.section.id}`, sectionForm);
      } else {
        await api.post('/admin/sections', sectionForm);
      }
      setSectionModal({ open: false });
      fetchData();
    } catch (err: any) {
      alert(err.message || '保存失败');
    }
  };

  const deleteSection = async (section: Section) => {
    if (!confirm(`确定删除栏目「${section.title}」及其所有卡片？`)) return;
    try {
      await api.del(`/admin/sections/${section.id}`);
      fetchData();
    } catch (err: any) {
      alert(err.message || '删除失败');
    }
  };

  if (loading) return <div style={{ color: '#b8a088', padding: 40 }}>加载中…</div>;

  return (
    <div>
      <div style={styles.header}>
        <h1 style={styles.title}>📝 内容管理</h1>
        <div style={styles.headerActions}>
          <button style={styles.btnOutline} onClick={openCreateSection}>+ 新建栏目</button>
          <button style={styles.btnPrimary} onClick={() => openCreatePost()}>+ 新建卡片</button>
        </div>
      </div>

      {/* 分类筛选 */}
      <div style={styles.filterBar}>
        {CATEGORIES.map((c) => (
          <button
            key={c.value}
            style={{ ...styles.filterBtn, ...(category === c.value ? styles.filterBtnActive : {}) }}
            onClick={() => setCategory(c.value)}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* 栏目 + 卡片列表 */}
      {sections.map((section) => {
        const posts = allPosts.filter((p) => p.sectionId === section.id);
        return (
          <div key={section.id} style={styles.sectionBlock}>
            <div style={styles.sectionHeader}>
              <span style={styles.sectionTitle}>{section.title}</span>
              <span style={styles.sectionMeta}>{CATEGORIES.find(c => c.value === section.category)?.label || section.category} · {posts.length} 张卡片</span>
              <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
                <button style={styles.btnSm} onClick={() => openEditSection(section)}>✏️ 编辑</button>
                <button style={styles.btnSmDanger} onClick={() => deleteSection(section)}>🗑️</button>
              </div>
            </div>

            <div style={styles.postGrid}>
              {posts.map((post) => (
                <div key={post.id} style={{ ...styles.postCard, opacity: post.published ? 1 : 0.55 }}>
                  <div style={styles.postEmoji}>{post.emoji}</div>
                  <div style={styles.postBadge}>{post.badge}</div>
                  <div style={styles.postTitle}>{post.title}</div>
                  <div style={styles.postDesc}>{post.description}</div>
                  <div style={styles.postActions}>
                    <button
                      style={{ ...styles.toggleBtn, background: post.published ? '#7d9a70' : '#d49b40' }}
                      onClick={() => togglePublish(post)}
                    >
                      {post.published ? '✅ 已发布' : '⏳ 待审核'}
                    </button>
                    <div style={styles.actionGroup}>
                      <button style={styles.btnSm} onClick={() => movePost(post, -1)}>↑</button>
                      <button style={styles.btnSm} onClick={() => movePost(post, 1)}>↓</button>
                      <button style={styles.btnSm} onClick={() => openEditPost(post)}>✏️</button>
                      <button style={styles.btnSmDanger} onClick={() => deletePost(post)}>🗑️</button>
                    </div>
                  </div>
                </div>
              ))}
              <button style={styles.addCardBtn} onClick={() => openCreatePost(section.id)}>
                + 添加卡片
              </button>
            </div>
          </div>
        );
      })}

      {/* ===== Post 编辑弹窗 ===== */}
      {postModal.open && (
        <div style={styles.overlay} onClick={() => setPostModal({ open: false })}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h2 style={styles.modalTitle}>{postModal.post ? '编辑卡片' : '新建卡片'}</h2>
            <div style={styles.formGroup}>
              <label style={styles.label}>标题</label>
              <input style={styles.input} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} maxLength={50} />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>描述</label>
              <input style={styles.input} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} maxLength={200} />
            </div>
            <div style={styles.formRow}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Emoji</label>
                <input style={styles.input} value={form.emoji} onChange={(e) => setForm({ ...form, emoji: e.target.value })} maxLength={10} />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>角标</label>
                <input style={styles.input} value={form.badge} onChange={(e) => setForm({ ...form, badge: e.target.value })} maxLength={10} />
              </div>
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>所属栏目</label>
              <select style={styles.input} value={form.sectionId} onChange={(e) => setForm({ ...form, sectionId: parseInt(e.target.value) })}>
                <option value={0}>-- 选择栏目 --</option>
                {sections.map((s) => (
                  <option key={s.id} value={s.id}>{s.title} ({s.category})</option>
                ))}
              </select>
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>图文详情</label>
              <textarea
                style={{ ...styles.input, height: 100, resize: 'vertical' }}
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
                placeholder="长文介绍，支持换行…"
              />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>图片</label>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <label style={{ ...styles.btnOutline, cursor: 'pointer', fontSize: 12, padding: '6px 12px' }}>
                  {uploading ? '上传中…' : '📷 上传图片'}
                  <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleUpload} disabled={uploading} />
                </label>
                <span style={{ fontSize: 11, color: '#b8a088' }}>单张不超过 5MB</span>
              </div>
              {(JSON.parse(form.images || '[]') as string[]).length > 0 && (
                <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
                  {(JSON.parse(form.images || '[]') as string[]).map((url: string, i: number) => (
                    <div key={i} style={{ position: 'relative' }}>
                      <img src={url} alt="" style={{ width: 80, height: 60, borderRadius: 8, objectFit: 'cover' }} />
                      <button
                        style={{ position: 'absolute', top: -6, right: -6, width: 20, height: 20, borderRadius: '50%', border: 'none', background: '#ef4444', color: '#fff', fontSize: 12, cursor: 'pointer', lineHeight: 1 }}
                        onClick={() => {
                          const images = JSON.parse(form.images || '[]') as string[];
                          images.splice(i, 1);
                          setForm({ ...form, images: JSON.stringify(images) });
                        }}
                      >×</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div style={styles.formRow}>
              <div style={styles.formGroup}>
                <label style={styles.label}>排序</label>
                <input style={styles.input} type="number" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: parseInt(e.target.value) || 0 })} />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>发布状态</label>
                <select style={styles.input} value={form.published ? '1' : '0'} onChange={(e) => setForm({ ...form, published: e.target.value === '1' })}>
                  <option value="1">已发布</option>
                  <option value="0">待审核</option>
                </select>
              </div>
            </div>
            <div style={styles.modalActions}>
              <button style={styles.btnOutline} onClick={() => setPostModal({ open: false })}>取消</button>
              <button style={styles.btnPrimary} onClick={savePost}>保存</button>
            </div>
          </div>
        </div>
      )}

      {/* ===== Section 编辑弹窗 ===== */}
      {sectionModal.open && (
        <div style={styles.overlay} onClick={() => setSectionModal({ open: false })}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h2 style={styles.modalTitle}>{sectionModal.section ? '编辑栏目' : '新建栏目'}</h2>
            <div style={styles.formGroup}>
              <label style={styles.label}>栏目名称</label>
              <input style={styles.input} value={sectionForm.title} onChange={(e) => setSectionForm({ ...sectionForm, title: e.target.value })} maxLength={50} />
            </div>
            <div style={styles.formRow}>
              <div style={styles.formGroup}>
                <label style={styles.label}>分类</label>
                <select style={styles.input} value={sectionForm.category} onChange={(e) => setSectionForm({ ...sectionForm, category: e.target.value })}>
                  <option value="food">美食</option>
                  <option value="travel">旅游</option>
                  <option value="fun">游玩</option>
                </select>
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>排序</label>
                <input style={styles.input} type="number" value={sectionForm.sortOrder} onChange={(e) => setSectionForm({ ...sectionForm, sortOrder: parseInt(e.target.value) || 0 })} />
              </div>
            </div>
            <div style={styles.modalActions}>
              <button style={styles.btnOutline} onClick={() => setSectionModal({ open: false })}>取消</button>
              <button style={styles.btnPrimary} onClick={saveSection}>保存</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  title: { fontSize: 22, fontWeight: 700, fontFamily: "'Playfair Display', serif" },
  headerActions: { display: 'flex', gap: 8 },
  btnPrimary: {
    padding: '8px 18px', borderRadius: 10, border: 'none', background: '#c06840', color: '#fff',
    fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: "'Source Sans 3', sans-serif",
  },
  btnOutline: {
    padding: '8px 18px', borderRadius: 10, border: '1px solid #e5d5c0', background: '#fff',
    color: '#2d1a0e', fontSize: 13, cursor: 'pointer', fontFamily: "'Source Sans 3', sans-serif",
  },
  btnSm: {
    padding: '4px 10px', borderRadius: 6, border: '1px solid #e5d5c0', background: '#fff',
    color: '#2d1a0e', fontSize: 12, cursor: 'pointer', fontFamily: "'Source Sans 3', sans-serif",
  },
  btnSmDanger: {
    padding: '4px 10px', borderRadius: 6, border: '1px solid #ef4444', background: '#fff',
    color: '#ef4444', fontSize: 12, cursor: 'pointer', fontFamily: "'Source Sans 3', sans-serif",
  },
  filterBar: { display: 'flex', gap: 6, marginBottom: 24 },
  filterBtn: {
    padding: '6px 16px', borderRadius: 20, border: '1px solid #e5d5c0', background: '#fff',
    fontSize: 13, cursor: 'pointer', color: '#b8a088', fontFamily: "'Source Sans 3', sans-serif",
  },
  filterBtnActive: { background: '#c06840', color: '#fff', borderColor: '#c06840' },
  sectionBlock: { marginBottom: 28 },
  sectionHeader: {
    display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12,
    paddingBottom: 10, borderBottom: '1px solid #e5d5c0',
  },
  sectionTitle: { fontSize: 16, fontWeight: 700, color: '#2d1a0e' },
  sectionMeta: { fontSize: 12, color: '#b8a088' },
  postGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 },
  postCard: {
    background: '#fff', borderRadius: 12, padding: 16, border: '1px solid #e5d5c0',
    position: 'relative', transition: 'all .2s',
  },
  postEmoji: { fontSize: 36, marginBottom: 8 },
  postBadge: {
    position: 'absolute', top: 12, right: 12, fontSize: 10, padding: '2px 8px',
    borderRadius: 10, background: 'rgba(45,26,14,.6)', color: '#fff',
  },
  postTitle: { fontSize: 14, fontWeight: 600, color: '#2d1a0e', marginBottom: 4 },
  postDesc: { fontSize: 12, color: '#b8a088', marginBottom: 12, lineHeight: 1.4 },
  postActions: { display: 'flex', flexDirection: 'column', gap: 6 },
  toggleBtn: {
    padding: '4px 10px', borderRadius: 6, border: 'none', color: '#fff',
    fontSize: 11, cursor: 'pointer', fontWeight: 500, textAlign: 'center' as const,
    fontFamily: "'Source Sans 3', sans-serif",
  },
  actionGroup: { display: 'flex', gap: 4, justifyContent: 'center' },
  addCardBtn: {
    minHeight: 140, borderRadius: 12, border: '2px dashed #e5d5c0', background: 'transparent',
    color: '#b8a088', fontSize: 14, cursor: 'pointer', display: 'flex',
    alignItems: 'center', justifyContent: 'center', fontFamily: "'Source Sans 3', sans-serif",
  },
  // Modal
  overlay: {
    position: 'fixed', inset: 0, background: 'rgba(45,26,14,.4)', display: 'flex',
    alignItems: 'center', justifyContent: 'center', zIndex: 200,
  },
  modal: {
    background: '#fff', borderRadius: 16, padding: 28, width: 480, maxWidth: '92vw',
    maxHeight: '85vh', overflow: 'auto', boxShadow: '0 20px 60px rgba(45,26,14,.18)',
  },
  modalTitle: { fontSize: 18, fontWeight: 700, marginBottom: 20, fontFamily: "'Playfair Display', serif" },
  formGroup: { marginBottom: 14, flex: 1 },
  formRow: { display: 'flex', gap: 12 },
  label: { display: 'block', fontSize: 12, color: '#b8a088', marginBottom: 4 },
  input: {
    width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #e5d5c0',
    fontSize: 14, outline: 'none', fontFamily: "'Source Sans 3', sans-serif",
    boxSizing: 'border-box' as const,
  },
  modalActions: { display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 20 },
};
