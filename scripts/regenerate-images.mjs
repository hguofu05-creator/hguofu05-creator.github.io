/**
 * 重新生成图片为「原画质」：详情/灯箱用原生分辨率(q95)，网格用 2000px(q90) 缩略图。
 * 仅更新 public/images/photos/ 下的 WebP 与 photos.json 的 width/height/sizes 字段，
 * 不会动 title/category/story/location/exif 等已填好的元数据。
 *
 * 用法：node scripts/regenerate-images.mjs ["源目录"]
 */
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const SOURCE_DIR = process.argv[2] || process.env.SOURCE_DIR || path.join(os.homedir(), 'Desktop', '作品集');
const OUT_DIR = path.join(ROOT, 'public', 'images', 'photos');
const DATA_FILE = path.join(ROOT, 'src', 'data', 'photos.json');

// 网格展示尺寸（用于快速加载）；详情/灯箱使用原生分辨率
const DISPLAY_W = 2000;
const FULL_QUALITY = 95;
const DISPLAY_QUALITY = 90;

function sanitize(name) {
  return name.replace(/[^a-zA-Z0-9_-]/g, '-');
}

if (!fs.existsSync(SOURCE_DIR)) {
  console.error(`❌ 找不到源目录：${SOURCE_DIR}`);
  process.exit(1);
}

const photos = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));

// 建立 id -> 原图路径 映射
const srcFiles = fs.readdirSync(SOURCE_DIR).filter((f) => /\.(jpe?g|png)$/i.test(f));
const idToFile = new Map();
for (const f of srcFiles) {
  const id = sanitize(path.parse(f).name);
  if (!idToFile.has(id)) idToFile.set(id, path.join(SOURCE_DIR, f));
}

let ok = 0;
let skip = 0;
for (const p of photos) {
  const srcPath = idToFile.get(p.id);
  if (!srcPath) {
    console.warn(`⚠️ 找不到原图：${p.id}（跳过，保留现有 WebP）`);
    skip++;
    continue;
  }
  const meta = await sharp(srcPath).metadata();
  const w = meta.width || 0;
  const h = meta.height || 0;

  // 1) 全尺寸（原生分辨率，原画质）
  const fullName = `${p.id}-${w}.webp`;
  await sharp(srcPath).webp({ quality: FULL_QUALITY, effort: 6 }).toFile(path.join(OUT_DIR, fullName));

  // 2) 网格缩略图（仅当原图比展示尺寸更大时才生成，否则与全尺寸相同）
  const sizes = [w];
  if (w > DISPLAY_W) {
    const dispName = `${p.id}-${DISPLAY_W}.webp`;
    await sharp(srcPath).resize(DISPLAY_W).webp({ quality: DISPLAY_QUALITY, effort: 4 }).toFile(path.join(OUT_DIR, dispName));
    sizes.unshift(DISPLAY_W); // 升序：[2000, 原生宽]
  }

  // 删除旧的 400/800/1600 尺寸（不再使用）
  for (const old of [400, 800, 1600]) {
    const fp = path.join(OUT_DIR, `${p.id}-${old}.webp`);
    if (fs.existsSync(fp)) fs.unlinkSync(fp);
  }

  p.width = w;
  p.height = h;
  p.sizes = sizes;
  ok++;
  console.log(`  ✅ ${p.id} -> 全尺寸 ${w}x${h} (q${FULL_QUALITY})` + (w > DISPLAY_W ? `，缩略图 ${DISPLAY_W}px` : ''));
}

fs.writeFileSync(DATA_FILE, JSON.stringify(photos, null, 2), 'utf-8');
console.log(`\n🎉 重新生成完成：${ok} 张成功，${skip} 张跳过。已更新 ${path.relative(ROOT, DATA_FILE)} 的 sizes/width/height。`);
