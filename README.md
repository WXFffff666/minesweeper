# 经典扫雷

🎮 **在线游玩**: [https://game2.the37777777.top/](https://game2.the37777777.top/)

像素级还原 Microsoft Windows XP/7 经典扫雷，纯静态 Web 应用。

## 功能特性

- **经典视觉风格**：忠实还原 Windows XP/7 扫雷的 3D 边框、LED 计数器和经典灰色主题
- **完整游戏机制**：左键揭开、右键插旗、双键和弦、首次点击安全、空白区域自动展开
- **难度级别**：初级 (9×9, 10 雷)、中级 (16×16, 40 雷)、高级 (16×30, 99 雷)、自定义
- **无尽模式**：胜利后自动进入下一局，难度递增，连胜追踪
- **移动端优化**：触控操作（点击揭开、长按插旗）、插旗模式切换、响应式布局
- **PWA 支持**：可安装为应用，离线可用（需 HTTPS）
- **音效**：Web Audio API 合成音效（无外部文件）
- **成就系统**：12 个可解锁成就
- **统计数据**：胜率、最佳时间、连胜、排行榜（本地）
- **主题**：经典（默认）、暗色、蓝色
- **键盘快捷键**：F2（新游戏）、1/2/3（难度）、M（静音）、F（插旗模式）
- **零依赖**：纯 HTML + CSS + JavaScript，无框架，无 npm

## 操作说明

### 桌面端
- **左键点击**：揭开格子
- **右键点击**：放置/移除旗帜
- **双键同按**（或中键）：和弦 - 当旗帜数匹配数字时揭开周围格子
- **笑脸按钮**：开始新游戏

### 移动端
- **点击**：揭开格子（插旗模式下为插旗）
- **长按** (500ms)：放置/移除旗帜
- **插旗模式按钮**：切换挖雷/插旗模式

## 本地运行

直接在浏览器中打开 `index.html` 即可，无需服务器。

或使用任意静态文件服务器：
```bash
# Python
python -m http.server 8000

# Node.js (npx, 无需安装)
npx serve .

# PHP
php -S localhost:8000
```

## 部署

### Cloudflare Pages
1. 推送到 GitHub
2. 前往 [Cloudflare Pages](https://pages.cloudflare.com)
3. 连接 GitHub 仓库
4. 构建输出目录设为 `/`（根目录）
5. 无需构建命令
6. 部署

### GitHub Pages
1. 推送到 GitHub
2. 进入仓库 Settings → Pages
3. Source: Deploy from a branch
4. 选择 `main` 分支，根目录
5. 保存 - 站点将在 `https://username.github.io/minesweeper/` 上线

### Netlify
1. 将 `minesweeper/` 文件夹拖放到 [Netlify Drop](https://app.netlify.com/drop)
2. 或连接 GitHub 仓库，无需构建命令

## Git 设置

```bash
cd minesweeper
git init
git add .
git commit -m "feat: complete classic minesweeper web game"

# 创建 GitHub 仓库并推送
gh repo create minesweeper --public --source=. --push

# 或手动操作：
# git remote add origin https://github.com/YOUR_USERNAME/minesweeper.git
# git push -u origin main
```

## 键盘快捷键

| 按键 | 功能 |
|------|------|
| F2 | 新游戏 |
| 1 | 初级难度 |
| 2 | 中级难度 |
| 3 | 高级难度 |
| M | 切换音效 |
| F | 切换插旗模式 |
| Esc | 关闭对话框/菜单 |

## 成就

| 成就 | 描述 |
|------|------|
| 首次胜利 | 赢得第一局游戏 |
| 速度恶魔 | 在 10 秒内完成初级 |
| 中级大师 | 在 60 秒内完成中级 |
| 高级大师 | 在 120 秒内完成高级 |
| 无旗通关 | 不放置任何旗帜赢得游戏 |
| 势不可挡 | 连续赢得 5 局 |
| 所向披靡 | 连续赢得 10 局 |
| 忠实玩家 | 游玩 50 局 |
| 扫雷上瘾 | 游玩 100 局 |
| 完美插旗 | 每面旗帜都插在雷上并获胜 |
| 无尽探索者 | 在无尽模式中赢得 50 局 |
| 全面发展 | 在三个难度上都获得胜利 |

## 技术细节

- **无构建步骤**：直接打开 index.html
- **零依赖**：纯原生 JavaScript
- **无框架**：仅 HTML + CSS + JS
- **离线可用**：PWA + Service Worker（需 HTTPS）
- **存储**：localStorage 保存设置、分数、成就
- **音效**：Web Audio API 合成（无音频文件）
- **性能**：事件委托、批量 DOM 更新、迭代式 BFS 洪水填充

## 项目结构

```
minesweeper/
├── index.html          # 主页面
├── manifest.json       # PWA 清单
├── sw.js              # Service Worker
├── LICENSE            # MIT 许可证
├── README.md          # 本文件
├── css/
│   ├── main.css       # 核心布局、窗口外观、对话框
│   ├── board.css      # 棋盘网格、格子状态、数字颜色
│   ├── themes.css     # 主题变量和覆盖样式
│   └── responsive.css # 移动端/平板响应式样式
├── js/
│   ├── namespace.js   # 全局 MS 命名空间
│   ├── config.js      # 难度预设、颜色、成就配置
│   ├── engine.js      # 核心游戏逻辑（纯逻辑，无 DOM）
│   ├── sound.js       # Web Audio API 音效合成
│   ├── storage.js     # localStorage 封装
│   ├── timer.js       # 游戏计时器
│   ├── renderer.js    # DOM 渲染
│   ├── input.js       # 鼠标/触控/键盘输入
│   ├── endless.js     # 无尽模式逻辑
│   ├── achievements.js # 成就系统
│   ├── stats.js       # 统计追踪
│   ├── themes.js      # 主题切换 + 键盘快捷键
│   └── app.js         # 主应用初始化和连接
└── icons/
    └── icon.svg       # PWA 图标
```

## 许可证

MIT License - 见 [LICENSE](LICENSE) 文件。
