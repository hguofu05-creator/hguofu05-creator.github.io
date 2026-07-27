# 个人摄影作品集网站

影视飓风风格（暗黑 / 电影感 / 大图冲击 / 极简克制）的静态作品集。
技术栈：**Astro 5 + Tailwind CSS + GitHub Pages**，0 预算、无后端、无数据库。

## 快速开始（本地预览）

```bash
npm install        # 安装依赖（只需一次）
npm run dev        # 启动本地预览，打开 http://localhost:4321
```

## 处理你的照片

照片放在桌面「作品集」文件夹（或任意目录）。运行：

```bash
npm run process                       # 默认读桌面「作品集」
# 或指定目录：
node scripts/process-images.mjs "D:/我的照片"
```

脚本会：
1. 把每张图转成 WebP，三个尺寸（400 / 800 / 1600 宽）写入 `public/images/photos/`
2. 用 `exifr` 读取 EXIF（相机、光圈、快门、ISO、焦距、日期）
3. 生成 `src/data/photos.json`

然后**打开 `src/data/photos.json`，给每张照片补充**：
- `title` 标题
- `category` 分类：`mountain`(山岳) / `water`(水域) / `forest`(森林) / `people`(人文)
- `story` 拍摄故事
- `location` 地点

（前 12 张默认是首页精选，第 1 张默认是首页 Hero 大图，可在 json 里改 `featured` / `cover`。）

## 修改全站信息

所有名字、副标题、邮箱、社交链接、设备清单都在 `src/consts.ts`。
关于页头像：把一张照片导出为 WebP 放到 `public/images/about.webp`。

## 部署到 GitHub Pages

1. 在 GitHub 新建仓库，推荐命名为 `<你的用户名>.github.io`（用户页，无需配置 base）。
2. 把代码推上去（见下方命令），并切到 `main` 分支。
3. 仓库 → Settings → Pages → Build and deployment → Source 选 **GitHub Actions**。
4. 推送后 Actions 自动构建并发布；地址即 `https://<你的用户名>.github.io`。

```bash
git init
git add .
git commit -m "init portfolio"
git branch -M main
git remote add origin https://github.com/<你的用户名>/<仓库名>.git
git push -u origin main
```

> 如果用「项目页」（仓库名不是 `<用户名>.github.io`），按 `astro.config.mjs` 里的注释设置 `base` 和 `site`。

## 目录结构

```
src/
  components/   Nav / Footer / PhotoCard / CategoryFilter
  layouts/      BaseLayout.astro（含字体、滚动淡入脚本）
  lib/photos.ts 照片数据 + 辅助函数
  pages/        index / gallery / photo/[slug] / about / contact / 404
  consts.ts     全站信息
  data/photos.json  照片数据（脚本生成）
  styles/global.css  全局样式（含 prefers-reduced-motion）
scripts/process-images.mjs  图片处理脚本
public/images/photos/       生成的 WebP
.github/workflows/deploy.yml 自动部署
```
