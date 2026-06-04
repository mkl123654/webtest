import { test, expect } from '@playwright/test';

test('页面加载正常', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle('胖喵 · 个人主页');
  await expect(page.locator('.profile-name')).toHaveText('胖喵');
});

test('个人信息默认展开，点击可收起', async ({ page }) => {
  await page.goto('/');
  const wrap = page.locator('.profile-info-wrap');
  await expect(wrap).toHaveClass(/open/);

  await page.locator('.profile-hint').click();
  await expect(wrap).not.toHaveClass(/open/);

  await page.locator('.profile-hint').click();
  await expect(wrap).toHaveClass(/open/);
});

test('三个Tab切换正常', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.tab-panel-header h2')).toContainText('美食推荐');

  await page.locator('.nav-tab', { hasText: '旅游推荐' }).click();
  await expect(page.locator('.tab-panel-header h2')).toContainText('旅游推荐');

  await page.locator('.nav-tab', { hasText: '游玩推荐' }).click();
  await expect(page.locator('.tab-panel-header h2')).toContainText('游玩推荐');
});

test('点击浮动按钮弹出聊天窗', async ({ page }) => {
  await page.goto('/');
  const popup = page.locator('.chat-popup');
  await expect(popup).not.toHaveClass(/open/);

  await page.locator('.chat-toggle-btn').click();
  await expect(popup).toHaveClass(/open/);

  await page.locator('.chat-popup .close-btn').click();
  await expect(popup).not.toHaveClass(/open/);
});

test('快捷提问按钮可点击', async ({ page }) => {
  await page.goto('/');
  await page.locator('.chat-toggle-btn').click();
  await page.locator('.quick-chip').first().click();

  // 用户消息已发送
  await expect(page.locator('.msg.user').first()).toBeVisible();
});

test('搜索框可输入并搜索', async ({ page }) => {
  await page.goto('/');
  await page.locator('.tab-search-input').fill('火锅');
  await page.locator('.tab-search-btn').click();

  // 搜索触发聊天弹窗
  await expect(page.locator('.chat-popup')).toHaveClass(/open/);
});

test('PC端展品4列布局', async ({ page }) => {
  await page.goto('/');
  await page.setViewportSize({ width: 1440, height: 900 });
  const gallery = page.locator('.gallery').first();
  await expect(gallery).toHaveCSS('grid-template-columns', /repeat\(4/);
});

test('移动端菜单按钮可见', async ({ page }) => {
  await page.goto('/');
  await page.setViewportSize({ width: 375, height: 812 });
  await expect(page.locator('.mobile-menu-btn')).toBeVisible();
});
