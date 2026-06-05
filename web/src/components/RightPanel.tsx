'use client';

import { useState, useEffect } from 'react';
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
}

interface SectionData {
  id: number;
  title: string;
  category: string;
  sortOrder: number;
  posts: PostItem[];
}

const tabData = {
  food: { title: '🍽️ 美食推荐', desc: '从街头小吃到精致料理，找到你的下一顿', placeholder: '搜美食、饮品…' },
  travel: { title: '✈️ 旅游推荐', desc: '周末去哪、小长假去哪，帮你安排明白', placeholder: '搜目的地、玩法…' },
  fun: { title: '🎮 游玩推荐', desc: '聚会、约会、一个人，都有好去处', placeholder: '搜聚会、体验、娱乐…' },
};

interface Props {
  activeTab: 'food' | 'travel' | 'fun';
}

export function RightPanel({ activeTab }: Props) {
  const data = tabData[activeTab];
  const [sections, setSections] = useState<SectionData[]>([]);

  // 搜索状态
  const [searchInput, setSearchInput] = useState('');
  const [searchKeyword, setSearchKeyword] = useState('');

  useEffect(() => {
    const params = new URLSearchParams();
    // 搜索时不限定分类，实现全局搜索
    if (!searchKeyword) params.set('category', activeTab);
    if (searchKeyword) params.set('search', searchKeyword);
    api.get<SectionData[]>(`/sections?${params.toString()}`)
      .then(setSections)
      .catch(() => setSections([]));
  }, [activeTab, searchKeyword]);

  const handleSearch = () => {
    setSearchKeyword(searchInput.trim());
  };

  const handleClear = () => {
    setSearchInput('');
    setSearchKeyword('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
  };

  // 搜索模式下合并所有匹配卡片为混合列表
  const allMatchedPosts = searchKeyword
    ? sections.flatMap(s => s.posts.map(p => ({ ...p, sectionCategory: s.category, sectionTitle: s.title })))
    : [];

  return (
    <main className="right-panel">
      <div className={`tab-panel active`}>
        <div className="tab-panel-header">
          <h2>{data.title}</h2>
          <p>{data.desc}</p>
          <div className="tab-search">
            <input
              type="text"
              className="tab-search-input"
              placeholder={data.placeholder}
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

        {searchKeyword ? (
          // 全局搜索：混合展示所有匹配卡片
          allMatchedPosts.length > 0 ? (
            <GallerySection
              title={`🔍 搜索结果："${searchKeyword}"（${allMatchedPosts.length} 个）`}
              items={allMatchedPosts.map(p => ({
                badge: p.badge,
                emoji: p.emoji,
                name: p.title,
                desc: p.description,
                postId: p.id,
                category: p.sectionCategory,
              }))}
            />
          ) : (
            <p style={{ textAlign: 'center', color: 'var(--taupe)', marginTop: 40, fontSize: 14 }}>
              没有找到与 "{searchKeyword}" 相关的内容，换个关键词试试
            </p>
          )
        ) : (
          // 正常模式：按栏目分组展示
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

        <footer className="footer">
          © 2026 胖喵 · 前端开发者
        </footer>
      </div>
    </main>
  );
}
