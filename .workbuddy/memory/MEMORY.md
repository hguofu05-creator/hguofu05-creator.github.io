# 项目长期记忆：个人摄影作品集网站

## 概况
- 影视飓风风格暗黑摄影作品集，纯静态。Astro 5 + Tailwind v3 + GitHub Pages，0 预算。
- 工作区根：`C:\Users\ocean\WorkBuddy\个人作品集网站`

## 关键约定
- 照片源：桌面 `C:\Users\ocean\Desktop\作品集`（84 张手机 JPG）。
- 图片处理：`node scripts/process-images.mjs "<源目录>"` → 生成 `public/images/photos/*.webp`(400/800/1600) + `src/data/photos.json`。
- 手机 EXIF 有限：日期从文件名解析，ISO/光圈可用；相机/镜头/焦距/快门常缺失（详情页自动隐藏空字段）。
- 分类枚举：`mountain`(山岳)/`water`(水域)/`forest`(森林)/`people`(人文)；`nature` 是筛选聚合（非 people）。
- 全站文案/名字/邮箱/社交：`src/consts.ts`；关于页头像：`public/images/about.webp`。

## 命令
- 本地预览：`npm run dev`（4321） / 生产预览：`npm run preview`
- 构建：`npm run build` → `dist/`
- 部署：推到 GitHub（建议 `<用户名>.github.io`），Settings→Pages→GitHub Actions；`.github/workflows/deploy.yml` 已就绪。
