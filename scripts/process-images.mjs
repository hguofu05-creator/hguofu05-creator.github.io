/**
 * 图片处理脚本：把原始照片转成 WebP 三尺寸，并生成 photos.json
 *
 * 用法：
 *   node scripts/process-images.mjs                 # 默认读取桌面「作品集」文件夹
 *   SOURCE_DIR="/path/to/photos" node scripts/...   # 用环境变量指定别的目录
 *   node scripts/process-images.mjs "D:/我的照片"    # 用命令行参数指定目录
 *
 * 依赖：sharp（转图）、exifr（读 EXIF）。已写在 package.json 的 devDependencies。
 */
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import exifr from 'exifr';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

// 1) 源目录：优先命令行参数，其次环境变量，最后默认桌面「作品集」
const SOURCE_DIR =
  process.argv[2] ||
  process.env.SOURCE_DIR ||
  path.join(os.homedir(), 'Desktop', '作品集');

// 2) 输出目录 & 数据文件
const OUT_DIR = path.join(ROOT, 'public', 'images', 'photos');
const DATA_FILE = path.join(ROOT, 'src', 'data', 'photos.json');
const SIZES = [400, 800, 1600];

fs.mkdirSync(OUT_DIR, { recursive: true });
fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });

if (!fs.existsSync(SOURCE_DIR)) {
  console.error(`❌ 找不到源目录：${SOURCE_DIR}`);
  console.error('   请用参数指定，例如：node scripts/process-images.mjs "D:/照片"');
  process.exit(1);
}

// 3) 收集照片文件（jpg / jpeg / png）
const files = fs
  .readdirSync(SOURCE_DIR)
  .filter((f) => /\.(jpe?g|png)$/i.test(f))
  .sort();

if (files.length === 0) {
  console.error(`❌ 源目录里没有照片：${SOURCE_DIR}`);
  process.exit(1);
}

console.log(`🔍 在 ${SOURCE_DIR} 找到 ${files.length} 张照片，开始处理...\n`);

// 4) 工具函数
function formatShutter(t) {
  if (!t) return '';
  if (t >= 1) return `${Number(t.toFixed(1))}s`;
  return `1/${Math.round(1 / t)}s`;
}
function formatDate(d) {
  if (!d || isNaN(new Date(d).getTime())) return '';
  const dt = new Date(d);
  const p = (n) => String(n).padStart(2, '0');
  return `${dt.getFullYear()}-${p(dt.getMonth() + 1)}-${p(dt.getDate())}`;
}
function sanitize(name) {
  return name.replace(/[^a-zA-Z0-9_-]/g, '-');
}
// 从文件名解析日期（手机照片文件名通常带日期，比 EXIF 更可靠）
function parseDateFromName(name) {
  let m = name.match(/mmexport(\d{13})/); // 微信导出：13 位毫秒时间戳
  if (m) return formatDate(Number(m[1]));
  m = name.match(/(\d{4})(\d{2})(\d{2})/); // IMG_20240618_... / MVIMG_...
  if (m) return `${m[1]}-${m[2]}-${m[3]}`;
  return '';
}
// APEX 光圈值 → f 数：f = 2^(value/2)
function apexAperture(v) {
  if (!v) return '';
  return `f/${Number(Math.pow(2, v / 2).toFixed(1))}`;
}

// 5) 逐张处理
const photos = [];
const usedIds = new Set();

for (let i = 0; i < files.length; i++) {
  const file = files[i];
  const srcPath = path.join(SOURCE_DIR, file);
  let id = sanitize(path.parse(file).name);
  while (usedIds.has(id)) id += '_'; // 防止重名
  usedIds.add(id);

  // 5a) 读取尺寸
  const meta = await sharp(srcPath).metadata();
  const width = meta.width || 0;
  const height = meta.height || 0;

  // 5b) 生成 WebP 三尺寸（只生成不超过原图宽度的尺寸）
  const sizes = [];
  for (const w of SIZES) {
    if (width >= w) {
      await sharp(srcPath).resize(w).webp({ quality: 80, effort: 4 }).toFile(
        path.join(OUT_DIR, `${id}-${w}.webp`)
      );
      sizes.push(w);
    }
  }
  // 极小图兜底：原图比 400 还小，就直接出一张原尺寸
  if (sizes.length === 0 && width > 0) {
    await sharp(srcPath).webp({ quality: 80 }).toFile(
      path.join(OUT_DIR, `${id}-${width}.webp`)
    );
    sizes.push(width);
  }

  // 5c) 读取 EXIF
  let exifRaw = {};
  try {
    exifRaw =
      (await exifr.parse(srcPath, {
        pick: [
          'Make', 'Model', 'FNumber', 'ExposureTime', 'ISO', 'ISOSpeed',
          'FocalLength', 'MaxApertureValue', 'DateTimeOriginal',
        ],
      })) || {};
  } catch {
    /* 有些文件没有 EXIF，忽略 */
  }

  // 日期优先用文件名（可靠），其次 EXIF
  const date = parseDateFromName(id) || formatDate(exifRaw.DateTimeOriginal);

  photos.push({
    id,
    src: `images/photos/${id}`,
    width,
    height,
    sizes, // 实际生成的尺寸列表（前端 srcset 用）
    title: date || id, // 默认用拍摄日期当标题，你可以在 photos.json 里改
    category: 'mountain', // 默认分类，请在 photos.json 里改成 mountain/water/forest/people
    story: '', // 拍摄故事，待补充
    location: '', // 拍摄地点，待补充
    date,
    featured: i < 12, // 前 12 张作为首页精选
    cover: i === 0, // 第 1 张作为首页 Hero 大图
    exif: {
      // 手机照片常缺 Make/Model/FNumber 等，缺了就留空（详情页会自动隐藏空字段）
      camera: exifRaw.Model || exifRaw.Make || '',
      lens: '', // 手机通常没有镜头信息，留空
      focalLength: exifRaw.FocalLength ? `${Math.round(exifRaw.FocalLength)}mm` : '',
      aperture: exifRaw.FNumber
        ? `f/${Number(exifRaw.FNumber).toFixed(1)}`
        : apexAperture(exifRaw.MaxApertureValue),
      shutter: formatShutter(exifRaw.ExposureTime),
      iso: exifRaw.ISOSpeed ? `ISO ${exifRaw.ISOSpeed}` : exifRaw.ISO ? `ISO ${exifRaw.ISO}` : '',
    },
  });

  console.log(`  ✅ [${i + 1}/${files.length}] ${file} -> ${id} (${width}x${height})`);
}

// 6) 写出 photos.json
fs.writeFileSync(DATA_FILE, JSON.stringify(photos, null, 2), 'utf-8');

console.log(`\n🎉 完成！生成了 ${photos.length} 条记录。`);
console.log(`   - 图片目录：${path.relative(ROOT, OUT_DIR)}/`);
console.log(`   - 数据文件：${path.relative(ROOT, DATA_FILE)}`);
console.log('\n📝 下一步：打开 src/data/photos.json，给每张照片补充 title / category / story / location。');
