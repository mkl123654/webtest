'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';

interface CategoryGroup {
  id: number;
  key: string;
  label: string;
  sortOrder: number;
  categories: CategoryItem[];
}

interface CategoryItem {
  id: number;
  key: string;
  label: string;
  icon: string;
  sortOrder: number;
  groupId: number;
  group?: { id: number; key: string; label: string };
}

const ICON_OPTIONS = ['🍽️','✈️','🎮','🏙️','🏛️','🌊','🏔️','🎬','🎵','🎯','👨‍👩‍👧','💑','🌸','☀️','🍂','❄️','🎪','🏠','🛒','💻'];

export default function CategoriesPage() {
  const [groups, setGroups] = useState<CategoryGroup[]>([]);
  const [loading, setLoading] = useState(true);

  // Group form
  const [groupForm, setGroupForm] = useState({ open: false, id: 0, key: '', label: '', sortOrder: 0 });
  // Category form
  const [catForm, setCatForm] = useState({ open: false, id: 0, key: '', label: '', icon: '🏷️', sortOrder: 0, groupId: 0 });

  const fetchGroups = useCallback(async () => {
    setLoading(true);
    try {
      setGroups(await api.get<CategoryGroup[]>('/categories'));
    } catch { setGroups([]); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchGroups(); }, [fetchGroups]);

  // === Group CRUD ===
  const saveGroup = async () => {
    const { open, id, ...data } = groupForm;
    if (!data.key.trim() || !data.label.trim()) return alert('Key 和名称不能为空');
    try {
      if (id) await api.put(`/admin/category-groups/${id}`, data);
      else await api.post('/admin/category-groups', data);
      setGroupForm({ open: false, id: 0, key: '', label: '', sortOrder: 0 });
      fetchGroups();
    } catch (e: any) { alert(e.message); }
  };

  const deleteGroup = async (id: number) => {
    if (!confirm('删除分组会同时删除其下所有标签，确定？')) return;
    try { await api.del(`/admin/category-groups/${id}`); fetchGroups(); }
    catch (e: any) { alert(e.message); }
  };

  // === Category CRUD ===
  const saveCategory = async () => {
    const { open, id, ...data } = catForm;
    if (!data.key.trim() || !data.label.trim() || !data.groupId) return alert('请填写完整信息');
    try {
      if (id) await api.put(`/admin/categories/${id}`, data);
      else await api.post('/admin/categories', data);
      setCatForm({ open: false, id: 0, key: '', label: '', icon: '🏷️', sortOrder: 0, groupId: 0 });
      fetchGroups();
    } catch (e: any) { alert(e.message); }
  };

  const deleteCategory = async (id: number) => {
    if (!confirm('确定删除此标签？')) return;
    try { await api.del(`/admin/categories/${id}`); fetchGroups(); }
    catch (e: any) { alert(e.message); }
  };

  if (loading) return <div style={{ color: '#b8a088' }}>加载中…</div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, color: '#2d1a0e' }}>🏷️ 标签管理</h1>
        <button style={styles.btn} onClick={() => setGroupForm({ open: true, id: 0, key: '', label: '', sortOrder: groups.length + 1 })}>
          + 新建分组
        </button>
      </div>

      {groups.map(g => (
        <div key={g.id} style={styles.groupCard}>
          <div style={styles.groupHeader}>
            <h3 style={{ fontSize: 16, color: '#2d1a0e', margin: 0 }}>
              📁 {g.label} <span style={{ fontSize: 12, color: '#b8a088', fontWeight: 400 }}>({g.key})</span>
            </h3>
            <div style={{ display: 'flex', gap: 6 }}>
              <button style={styles.smallBtn} onClick={() => setGroupForm({ open: true, id: g.id, key: g.key, label: g.label, sortOrder: g.sortOrder })}>✏️</button>
              <button style={{ ...styles.smallBtn, background: '#fee2e2', color: '#dc2626' }} onClick={() => deleteGroup(g.id)}>🗑</button>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {g.categories.map(c => (
              <div key={c.id} style={styles.catRow}>
                <span style={{ fontSize: 20 }}>{c.icon}</span>
                <span style={{ fontWeight: 600, color: '#2d1a0e', minWidth: 60 }}>{c.label}</span>
                <span style={{ fontSize: 11, color: '#b8a088' }}>{c.key}</span>
                <span style={{ fontSize: 11, color: '#b8a088', marginLeft: 'auto' }}>排序: {c.sortOrder}</span>
                <button style={styles.smallBtn} onClick={() => setCatForm({ open: true, id: c.id, key: c.key, label: c.label, icon: c.icon, sortOrder: c.sortOrder, groupId: c.groupId })}>✏️</button>
                <button style={{ ...styles.smallBtn, background: '#fee2e2', color: '#dc2626' }} onClick={() => deleteCategory(c.id)}>🗑</button>
              </div>
            ))}
          </div>

          <button
            style={{ ...styles.btn, marginTop: 12, background: '#fff', color: '#c06840', border: '1px solid #e5d5c0' }}
            onClick={() => setCatForm({ open: true, id: 0, key: '', label: '', icon: '🏷️', sortOrder: g.categories.length + 1, groupId: g.id })}
          >
            + 添加标签
          </button>
        </div>
      ))}

      {/* Group Modal */}
      {groupForm.open && (
        <div style={styles.overlay} onClick={() => setGroupForm({ ...groupForm, open: false })}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <h3>{groupForm.id ? '编辑分组' : '新建分组'}</h3>
            <label style={styles.label}>Key（英文标识）</label>
            <input style={styles.input} value={groupForm.key} onChange={e => setGroupForm({ ...groupForm, key: e.target.value })} placeholder="city" />
            <label style={styles.label}>名称</label>
            <input style={styles.input} value={groupForm.label} onChange={e => setGroupForm({ ...groupForm, label: e.target.value })} placeholder="城市" />
            <label style={styles.label}>排序</label>
            <input style={styles.input} type="number" value={groupForm.sortOrder} onChange={e => setGroupForm({ ...groupForm, sortOrder: +e.target.value })} />
            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <button style={styles.btn} onClick={saveGroup}>保存</button>
              <button style={{ ...styles.btn, background: '#b8a088' }} onClick={() => setGroupForm({ ...groupForm, open: false })}>取消</button>
            </div>
          </div>
        </div>
      )}

      {/* Category Modal */}
      {catForm.open && (
        <div style={styles.overlay} onClick={() => setCatForm({ ...catForm, open: false })}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <h3>{catForm.id ? '编辑标签' : '新建标签'}</h3>
            <label style={styles.label}>Key（英文标识）</label>
            <input style={styles.input} value={catForm.key} onChange={e => setCatForm({ ...catForm, key: e.target.value })} placeholder="shenzhen" />
            <label style={styles.label}>名称</label>
            <input style={styles.input} value={catForm.label} onChange={e => setCatForm({ ...catForm, label: e.target.value })} placeholder="深圳" />
            <label style={styles.label}>图标</label>
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 8 }}>
              {ICON_OPTIONS.map(icon => (
                <button key={icon} style={{
                  ...styles.iconBtn,
                  ...(catForm.icon === icon ? { borderColor: '#c06840', background: '#fef5ee' } : {}),
                }} onClick={() => setCatForm({ ...catForm, icon })}>{icon}</button>
              ))}
            </div>
            <label style={styles.label}>所属分组</label>
            <select style={styles.input} value={catForm.groupId} onChange={e => setCatForm({ ...catForm, groupId: +e.target.value })}>
              <option value={0}>选择分组…</option>
              {groups.map(g => <option key={g.id} value={g.id}>{g.label}</option>)}
            </select>
            <label style={styles.label}>排序</label>
            <input style={styles.input} type="number" value={catForm.sortOrder} onChange={e => setCatForm({ ...catForm, sortOrder: +e.target.value })} />
            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <button style={styles.btn} onClick={saveCategory}>保存</button>
              <button style={{ ...styles.btn, background: '#b8a088' }} onClick={() => setCatForm({ ...catForm, open: false })}>取消</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  btn: {
    padding: '8px 20px', borderRadius: 10, border: 'none', background: '#c06840',
    color: '#fff', fontSize: 14, cursor: 'pointer', fontWeight: 600, fontFamily: 'inherit',
  },
  smallBtn: {
    padding: '4px 8px', borderRadius: 6, border: 'none', background: '#fdfaf6',
    color: '#2d1a0e', cursor: 'pointer', fontSize: 13, fontFamily: 'inherit',
  },
  groupCard: {
    background: '#fff', borderRadius: 16, padding: 20, marginBottom: 16,
    border: '1px solid #e5d5c0', boxShadow: '0 2px 8px rgba(45,26,14,.06)',
  },
  groupHeader: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    paddingBottom: 12, borderBottom: '1px solid #e5d5c0', marginBottom: 12,
  },
  catRow: {
    display: 'flex', alignItems: 'center', gap: 8,
    padding: '8px 12px', borderRadius: 10, background: '#fdfaf6',
  },
  overlay: {
    position: 'fixed', inset: 0, background: 'rgba(45,26,14,.4)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200,
  },
  modal: {
    background: '#fff', borderRadius: 20, padding: 28, width: 440, maxHeight: '80vh', overflow: 'auto',
    boxShadow: '0 20px 60px rgba(45,26,14,.18)',
  },
  label: { display: 'block', fontSize: 13, color: '#8a7a6a', marginBottom: 4, marginTop: 12 },
  input: {
    width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #e5d5c0',
    fontSize: 14, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' as const,
  },
  iconBtn: {
    width: 36, height: 36, fontSize: 18, borderRadius: 8, border: '2px solid transparent',
    background: '#fdfaf6', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
};
