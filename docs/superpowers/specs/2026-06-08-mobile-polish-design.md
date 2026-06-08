# 移动端样式优化 & ChatFloat 拖拽 — 设计文档

> 日期：2026-06-08 | 状态：待实现

---

## 一、搜索栏与汉堡按钮重叠修复

**问题**：移动端 `position:fixed` 的汉堡按钮（top:16px left:16px）与搜索栏 `.recommend-search`（padding:16px）重叠

**方案**：移动端搜索栏加左内边距让出汉堡按钮空间

```
移动端布局：
┌──────────────────────────┐
│ ☰  [🔍 搜美食、饮品…搜索] │  ← 同一行
│   [🍽️美食] [✈️旅游] [🎮游玩] │
```

**实施**：
- `globals.css` 768px 媒体查询：`.recommend-search { padding: 16px 16px 0 56px }`
- 汉堡按钮保持 `position:fixed`，位置不变

---

## 二、分类标签文案缩短 + 横向滑动

**问题**：移动端"🍽️ 美食推荐"等标签名太长，一行放不下

**方案**：统一缩短文案，容器支持横向滑动（PC 也支持，为未来扩展预留）

| | 改前 | 改后 |
|--|------|------|
| 美食 | 🍽️ 美食推荐 | 🍽️ 美食 |
| 旅游 | ✈️ 旅游推荐 | ✈️ 旅游 |
| 游玩 | 🎮 游玩推荐 | 🎮 游玩 |

**实施**：
- `RecommendContent.tsx`：`TABS` 数组 label 改为短文案
- `FavoritesContent.tsx`：`TABS` 数组 label 改为短文案
- `globals.css`：
  - `.category-tabs` 添加 `overflow-x: auto; flex-wrap: nowrap; scrollbar-width: none; -webkit-overflow-scrolling: touch`
  - `.category-tabs::-webkit-scrollbar { display: none }` 隐藏滚动条
  - 移动端 `justify-content: flex-start` 让标签从左侧开始

---

## 三、ChatFloat 拖拽功能

### 3.1 交互行为

| 特性 | PC 端 | 移动端 |
|------|-------|--------|
| 触发 | mousedown → mousemove → mouseup | touchstart → touchmove → touchend |
| 按钮形态 | 长条 pill（保持不变） | 48px 圆形（保持不变） |
| 光标 | `grab` / `grabbing` | 手指拖拽，`touch-action: none` |
| 弹窗 | 点击打开（不拖拽时），拖拽时不触发 | 同 PC |
| 吸附 | 左右 30px 内自动贴边 | 同 PC |
| 边界 | 不超出屏幕可视区 | 同 PC，下方留 TabBar 间距 |
| 记忆 | localStorage `chat-float-pos` | 同 PC |

### 3.2 吸附规则

- 按钮右边缘距屏幕右边 < 30px → 吸附到右边
- 按钮左边缘距屏幕左边 < 30px → 吸附到左边
- 上下不吸附，用户可以自由放置高度
- 吸附时 y 坐标保持不变

### 3.3 边界限制

- left: 最小 0，最大 windowWidth - buttonWidth
- top: 最小 0，最大 windowHeight - buttonHeight - (移动端：TabBar 60px)
- 弹窗弹出方向：默认向上，如果上方空间不足则向下

### 3.4 实现方式

在 `ChatFloat.tsx` 组件内部直接处理：
- `useState` 管理 position（x, y）
- `useRef` 存储拖拽状态（isDragging, startPos, hasMoved）
- `useEffect` 初始化时从 localStorage 读取位置
- 移动超过 5px 才算拖拽（防止误触）
- 拖拽时 `setPointerCapture` 防止丢失事件
- 拖拽结束后写入 localStorage 并判断吸附

### 3.5 点击与拖拽区分

- 移动距离 < 5px → 视为点击，切换弹窗
- 移动距离 ≥ 5px → 视为拖拽，不触发弹窗

---

## 四、改动文件清单

| 文件 | 操作 | 说明 |
|------|------|------|
| `web/src/app/globals.css` | 修改 | 搜索栏 padding、标签滑动、drag 样式 |
| `web/src/components/RecommendContent.tsx` | 修改 | TABS label 缩短 |
| `web/src/app/(main)/favorites/FavoritesContent.tsx` | 修改 | TABS label 缩短 |
| `web/src/components/ChatFloat.tsx` | 修改 | 新增拖拽 + localStorage + 吸附 |

---

## 五、验证

1. 移动端（≤768px）搜索栏不与汉堡按钮重叠
2. 分类标签一行显示，不换行，可横向滑动
3. PC 端拖拽 ChatFloat 到任意位置 → 刷新后位置保持
4. 拖拽到屏幕左/右边缘 30px 内 → 自动吸附贴边
5. 移动端手指拖拽圆形按钮 → 不触发弹窗
6. 点击按钮（不拖动）→ 正常打开/关闭弹窗
7. `npx tsc --noEmit` 零错误
