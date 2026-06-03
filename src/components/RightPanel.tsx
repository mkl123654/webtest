'use client';

import { GallerySection } from './GallerySection';

// 展品数据
const foodSections = [
  {
    title: '招牌美食',
    items: [
      { badge: '必吃', emoji: '🍜', name: '兰州牛肉面', desc: '一清二白三红四绿五黄' },
      { badge: '特色', emoji: '🦀', name: '潮汕生腌', desc: '潮汕毒药，鲜入骨髓' },
      { badge: '经典', emoji: '🍕', name: '那不勒斯披萨', desc: '窑炉现烤，焦边豹纹' },
      { badge: '暖心', emoji: '🍲', name: '日式寿喜烧', desc: '和牛蘸生蛋液，甜咸交织入口即化' },
    ],
  },
  {
    title: '人气饮品',
    items: [
      { badge: '爆款', emoji: '🧋', name: '手打柠檬茶', desc: '暴打香水柠檬，一口入夏' },
      { badge: '精品', emoji: '☕', name: '精品手冲咖啡', desc: '埃塞俄比亚耶加雪菲，花香四溢' },
      { badge: '小众', emoji: '🍺', name: '精酿啤酒', desc: 'IPA、Stout、酸啤，总有对味' },
      { badge: '清爽', emoji: '🍹', name: '莫吉托', desc: '朗姆+青柠+薄荷+苏打，夏日标配' },
    ],
  },
];

const travelSections = [
  {
    title: '户外出行',
    items: [
      { badge: '治愈', emoji: '🏕️', name: '城市周边露营', desc: '篝火、星空、烤肉，逃离 996' },
      { badge: '休闲', emoji: '🚴', name: '城市骑行路线', desc: '沿河老街慢骑，看到好吃的就停' },
      { badge: '推荐', emoji: '⛰️', name: '周边一日徒步', desc: '轻装上阵，山野间呼吸新鲜空气' },
      { badge: '放松', emoji: '🌿', name: '郊野公园野餐', desc: '带块毯子带本书，晒一下午太阳' },
    ],
  },
  {
    title: '文艺打卡',
    items: [
      { badge: '出片', emoji: '📸', name: '创意园区探店', desc: '老厂房改造，随手拍都是大片' },
      { badge: '文艺', emoji: '🎨', name: '美术馆巡礼', desc: '当代艺术、传统书画，安静一下午' },
      { badge: '小众', emoji: '🏘️', name: '古镇老街漫步', desc: '青石板路，小桥流水，吃遍老字号' },
      { badge: '夜游', emoji: '🌃', name: '城市夜景天台', desc: '一杯酒俯瞰万家灯火，浪漫满分' },
    ],
  },
];

const funSections = [
  {
    title: '聚会社交',
    items: [
      { badge: '聚会', emoji: '🎱', name: '潮玩综合体', desc: '桌游 · 保龄球 · 电玩一站式' },
      { badge: '烧脑', emoji: '🧩', name: '密室逃脱', desc: '拉上朋友关小黑屋解谜，智商考验' },
      { badge: '解压', emoji: '🎤', name: '私人 KTV', desc: '小包间嗨唱，吃喝一条龙' },
      { badge: '竞技', emoji: '🎯', name: '射箭·飞镖馆', desc: '解压神器，新手也能很快上手' },
    ],
  },
  {
    title: '沉浸体验',
    items: [
      { badge: '新潮', emoji: '🎬', name: '沉浸式剧场', desc: '打破第四面墙，你就是戏中人' },
      { badge: '动手', emoji: '🛠️', name: 'DIY 手作坊', desc: '陶艺、银饰、烘焙，成品带回家' },
      { badge: '放松', emoji: '🧘', name: '减压体验馆', desc: '摔碗、拳击、冥想，释放压力' },
      { badge: '趣味', emoji: '🎨', name: '流体画体验', desc: '不用画笔，颜料倒下去就是艺术' },
    ],
  },
];

const tabData = {
  food: { title: '🍽️ 美食推荐', desc: '从街头小吃到精致料理，找到你的下一顿', placeholder: '搜美食、饮品…', sections: foodSections },
  travel: { title: '✈️ 旅游推荐', desc: '周末去哪、小长假去哪，帮你安排明白', placeholder: '搜目的地、玩法…', sections: travelSections },
  fun: { title: '🎮 游玩推荐', desc: '聚会、约会、一个人，都有好去处', placeholder: '搜聚会、体验、娱乐…', sections: funSections },
};

interface Props {
  activeTab: 'food' | 'travel' | 'fun';
}

export function RightPanel({ activeTab }: Props) {
  const data = tabData[activeTab];

  return (
    <main className="right-panel">
      <div className={`tab-panel active`}>
        <div className="tab-panel-header">
          <h2>{data.title}</h2>
          <p>{data.desc}</p>
          <div className="tab-search">
            <input type="text" className="tab-search-input" placeholder={data.placeholder} maxLength={200} />
            <button className="tab-search-btn">搜索</button>
          </div>
        </div>

        {data.sections.map((section, i) => (
          <GallerySection key={i} title={section.title} items={section.items} />
        ))}

        <footer className="footer">
          © 2026 胖喵 · 前端开发者
        </footer>
      </div>
    </main>
  );
}
