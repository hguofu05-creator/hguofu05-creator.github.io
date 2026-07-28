/**
 * 把用户上传的个人水印（白底 JPG/PNG）处理成：
 * 1) 去白底 → 透明 PNG
 * 2) 加柔和暗色投影，保证在浅色/亮色照片上也能看清
 * 3) 保留原图灰色调与笔触美感
 *
 * 输出：scripts/watermark.png（供 regenerate-images.mjs 叠加到全尺寸照片上）
 */
import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const INPUT = process.argv[2];
const OUTPUT = path.join(__dirname, 'watermark.png');

if (!INPUT || !fs.existsSync(INPUT)) {
  console.error(`用法：node scripts/prepare-watermark.mjs <原始水印图片路径>`);
  process.exit(1);
}

const LOGO_OPACITY = 0.85;     // 主水印不透明度
const SHADOW_OPACITY = 0.35;   // 投影不透明度
const SHADOW_BLUR = 6;         // 投影模糊半径
const SHADOW_OFFSET = 4;       // 投影偏移（像素）
const PAD = 20;                // 画布边距，要大于 blur+offset

// 1) 读取原图 raw RGBA
const { data, info } = await sharp(INPUT).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const { width, height } = info;

// 2) 去白底 + 调整整体透明度
const logoData = Buffer.from(data);
for (let i = 0; i < logoData.length; i += 4) {
  const r = logoData[i];
  const g = logoData[i + 1];
  const b = logoData[i + 2];
  if (r > 245 && g > 245 && b > 245) {
    logoData[i + 3] = 0;
  } else {
    const whiteness = Math.max(r, g, b) / 255;
    logoData[i + 3] = Math.round(255 * LOGO_OPACITY * (1 - (whiteness - 0.5) * 0.4));
  }
}

// 3) 制作黑色投影（R=G=B=0，alpha = 原 alpha * SHADOW_OPACITY）
const shadowData = Buffer.alloc(logoData.length);
for (let i = 0; i < logoData.length; i += 4) {
  shadowData[i] = 0;
  shadowData[i + 1] = 0;
  shadowData[i + 2] = 0;
  shadowData[i + 3] = Math.round(logoData[i + 3] * SHADOW_OPACITY);
}

const shadowPng = await sharp(shadowData, { raw: { width, height, channels: 4 } })
  .png()
  .toBuffer();

// 4) 把投影放到更大的画布上再模糊，制造柔和阴影
const canvasW = width + PAD * 2;
const canvasH = height + PAD * 2;

const shadowLayer = await sharp({
  create: { width: canvasW, height: canvasH, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
})
  .composite([{ input: shadowPng, left: PAD + SHADOW_OFFSET, top: PAD + SHADOW_OFFSET }])
  .blur(SHADOW_BLUR)
  .png()
  .toBuffer();

// 5) 投影在下，原水印在上，合并为最终带影水印
const final = await sharp({
  create: { width: canvasW, height: canvasH, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
})
  .composite([
    { input: shadowLayer, left: 0, top: 0 },
    { input: logoData, raw: { width, height, channels: 4 }, left: PAD, top: PAD },
  ])
  .png()
  .toFile(OUTPUT);

console.log(`✅ 水印已处理：${OUTPUT} (${canvasW}x${canvasH})`);
