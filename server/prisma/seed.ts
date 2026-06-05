import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const sections = [
  // 美食
  { title: '招牌美食', category: 'food', sortOrder: 1 },
  { title: '人气饮品', category: 'food', sortOrder: 2 },
  // 旅游
  { title: '户外出行', category: 'travel', sortOrder: 1 },
  { title: '文艺打卡', category: 'travel', sortOrder: 2 },
  // 游玩
  { title: '聚会社交', category: 'fun', sortOrder: 1 },
  { title: '沉浸体验', category: 'fun', sortOrder: 2 },
];

const posts = [
  // 招牌美食
  { title: '兰州牛肉面', description: '一清二白三红四绿五黄', emoji: '🍜', badge: '必吃', published: true, sortOrder: 1, sectionTitle: '招牌美食' },
  { title: '潮汕生腌', description: '潮汕毒药，鲜入骨髓', emoji: '🦀', badge: '特色', published: true, sortOrder: 2, sectionTitle: '招牌美食' },
  { title: '那不勒斯披萨', description: '窑炉现烤，焦边豹纹', emoji: '🍕', badge: '经典', published: true, sortOrder: 3, sectionTitle: '招牌美食' },
  { title: '日式寿喜烧', description: '和牛蘸生蛋液，甜咸交织入口即化', emoji: '🍲', badge: '暖心', published: true, sortOrder: 4, sectionTitle: '招牌美食' },
  // 人气饮品
  { title: '手打柠檬茶', description: '暴打香水柠檬，一口入夏', emoji: '🧋', badge: '爆款', published: true, sortOrder: 1, sectionTitle: '人气饮品' },
  { title: '精品手冲咖啡', description: '埃塞俄比亚耶加雪菲，花香四溢', emoji: '☕', badge: '精品', published: true, sortOrder: 2, sectionTitle: '人气饮品' },
  { title: '精酿啤酒', description: 'IPA、Stout、酸啤，总有对味', emoji: '🍺', badge: '小众', published: true, sortOrder: 3, sectionTitle: '人气饮品' },
  { title: '莫吉托', description: '朗姆+青柠+薄荷+苏打，夏日标配', emoji: '🍹', badge: '清爽', published: true, sortOrder: 4, sectionTitle: '人气饮品' },
  // 户外出行
  { title: '城市周边露营', description: '篝火、星空、烤肉，逃离 996', emoji: '🏕️', badge: '治愈', published: true, sortOrder: 1, sectionTitle: '户外出行' },
  { title: '城市骑行路线', description: '沿河老街慢骑，看到好吃的就停', emoji: '🚴', badge: '休闲', published: true, sortOrder: 2, sectionTitle: '户外出行' },
  { title: '周边一日徒步', description: '轻装上阵，山野间呼吸新鲜空气', emoji: '⛰️', badge: '推荐', published: true, sortOrder: 3, sectionTitle: '户外出行' },
  { title: '郊野公园野餐', description: '带块毯子带本书，晒一下午太阳', emoji: '🌿', badge: '放松', published: true, sortOrder: 4, sectionTitle: '户外出行' },
  // 文艺打卡
  { title: '创意园区探店', description: '老厂房改造，随手拍都是大片', emoji: '📸', badge: '出片', published: true, sortOrder: 1, sectionTitle: '文艺打卡' },
  { title: '美术馆巡礼', description: '当代艺术、传统书画，安静一下午', emoji: '🎨', badge: '文艺', published: true, sortOrder: 2, sectionTitle: '文艺打卡' },
  { title: '古镇老街漫步', description: '青石板路，小桥流水，吃遍老字号', emoji: '🏘️', badge: '小众', published: true, sortOrder: 3, sectionTitle: '文艺打卡' },
  { title: '城市夜景天台', description: '一杯酒俯瞰万家灯火，浪漫满分', emoji: '🌃', badge: '夜游', published: true, sortOrder: 4, sectionTitle: '文艺打卡' },
  // 聚会社交
  { title: '潮玩综合体', description: '桌游 · 保龄球 · 电玩一站式', emoji: '🎱', badge: '聚会', published: true, sortOrder: 1, sectionTitle: '聚会社交' },
  { title: '密室逃脱', description: '拉上朋友关小黑屋解谜，智商考验', emoji: '🧩', badge: '烧脑', published: true, sortOrder: 2, sectionTitle: '聚会社交' },
  { title: '私人 KTV', description: '小包间嗨唱，吃喝一条龙', emoji: '🎤', badge: '解压', published: true, sortOrder: 3, sectionTitle: '聚会社交' },
  { title: '射箭·飞镖馆', description: '解压神器，新手也能很快上手', emoji: '🎯', badge: '竞技', published: true, sortOrder: 4, sectionTitle: '聚会社交' },
  // 沉浸体验
  { title: '沉浸式剧场', description: '打破第四面墙，你就是戏中人', emoji: '🎬', badge: '新潮', published: true, sortOrder: 1, sectionTitle: '沉浸体验' },
  { title: 'DIY 手作坊', description: '陶艺、银饰、烘焙，成品带回家', emoji: '🛠️', badge: '动手', published: true, sortOrder: 2, sectionTitle: '沉浸体验' },
  { title: '减压体验馆', description: '摔碗、拳击、冥想，释放压力', emoji: '🧘', badge: '放松', published: true, sortOrder: 3, sectionTitle: '沉浸体验' },
  { title: '流体画体验', description: '不用画笔，颜料倒下去就是艺术', emoji: '🎨', badge: '趣味', published: true, sortOrder: 4, sectionTitle: '沉浸体验' },
];

async function main() {
  console.log('🌱 开始填充数据…\n');

  // 清空旧数据（按依赖顺序）
  await prisma.post.deleteMany();
  await prisma.section.deleteMany();

  // 创建栏目
  const sectionMap = new Map<string, number>();
  for (const s of sections) {
    const created = await prisma.section.create({ data: s });
    sectionMap.set(created.title, created.id);
    console.log(`  ✓ 栏目: ${created.title} (${created.category})`);
  }

  // 创建卡片
  for (const p of posts) {
    const sectionId = sectionMap.get(p.sectionTitle);
    if (!sectionId) {
      console.log(`  ✗ 找不到栏目: ${p.sectionTitle}`);
      continue;
    }
    const { sectionTitle, ...data } = p;
    await prisma.post.create({ data: { ...data, sectionId } });
  }
  console.log(`\n  ✓ ${posts.length} 张卡片已创建`);

  // 设置管理员（将第一个注册用户提权为 ADMIN）
  const firstUser = await prisma.user.findFirst({ orderBy: { id: 'asc' } });
  if (firstUser && firstUser.role !== 'ADMIN') {
    await prisma.user.update({ where: { id: firstUser.id }, data: { role: 'ADMIN' } });
    console.log(`\n  👑 已将用户 "${firstUser.username}" 设为管理员`);
  } else if (firstUser) {
    console.log(`\n  ℹ️ 用户 "${firstUser.username}" 已是管理员`);
  } else {
    console.log('\n  ⚠️ 暂无注册用户，请先注册后再运行 seed');
  }

  console.log('\n✅ 数据填充完成');
}

main()
  .catch((e) => {
    console.error('❌ Seed 失败:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
