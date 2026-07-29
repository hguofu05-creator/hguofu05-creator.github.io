/**
 * 把用户上传的个人水印（白底 JPG/PNG）处理成：
 * 1) 去白底 → 透明 PNG
 * 2) 双重对比处理，保证在【深色】与【浅色】照片上都清晰可读：
 *    - 白色晕边（white halo）：深色照片上 logo 周围一圈白光，立刻跳出来
 *    - 深色投影（dark shadow）：浅色/明亮照片上 logo 有暗影，与背景分离
 * 3) logo 本体不透明度拉满，笔触美感保留
 *
 * 输出：scripts/watermark.png（供 regenerate-images.mjs 叠加到全尺寸照片右下角）
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

const LOGO_OPACITY = 1.0;       // logo 本体不透明度（拉满，确保清晰）
const WHITE_HALO_ALPHA = 0.75;  // 白色晕边强度（深色照片可读，不过度抢眼）
const WHITE_HALO_BLUR = 6;      // 晕边羽化半径
const SHADOW_ALPHA = 0.55;      // 深色投影强度（浅色照片可读）
const SHADOW_BLUR = 5;          // 投影羽化半径
const SHADOW_OFFSET = 3;        // 投影偏移
const PAD = 24;                 // 画布边距，须大于 blur+offset

// 1) 读取原图 raw RGBA
const { data, info } = await sharp(INPUT).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const { width, height } = info;

// 2) logo 本体：去白底，非白像素保留原色并设满不透明
const logoColor = Buffer.from(data);
for (let i = 0; i < logoColor.length; i += 4) {
  const r = logoColor[i];
  const g = logoColor[i + 1];
  const b = logoColor[i + 2];
  if (r > 245 && g > 245 && b > 245) {
    logoColor[i + 3] = 0; // 白底透明
  } else {
    logoColor[i + 3] = Math.round(255 * LOGO_OPACITY);
  }
}

// 3) 白色晕边层：把 logo 形状填成白色（带 halo 透明度），用于深色背景
const whiteMask = Buffer.from(logoColor);
for (let i = 0; i < whiteMask.length; i += 4) {
  if (whiteMask[i + 3] > 0) {
    whiteMask[i] = 255;
    whiteMask[i + 1] = 255;
    whiteMask[i + 2] = 255;
    whiteMask[i + 3] = Math.round(255 * WHITE_HALO_ALPHA);
  }
}
const whiteHaloLayer = await sharp({
  create: { width: width + PAD * 2, height: height + PAD * 2, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
})
  .composite([{ input: whiteMask, raw: { width, height, channels: 4 }, left: PAD, top: PAD }])
  .blur(WHITE_HALO_BLUR)
  .png()
  .toBuffer();

// 4) 深色投影层：把 logo 形状填成黑色（带投影透明度），偏移后模糊
const shadowMask = Buffer.from(logoColor);
for (let i = 0; i < shadowMask.length; i += 4) {
  if (shadowMask[i + 3] > 0) {
    shadowMask[i] = 0;
    shadowMask[i + 1] = 0;
    shadowMask[i + 2] = 0;
    shadowMask[i + 3] = Math.round(255 * SHADOW_ALPHA);
  }
}
const shadowLayer = await sharp({
  create: { width: width + PAD * 2, height: height + PAD * 2, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
})
  .composite([{ input: shadowMask, raw: { width, height, channels: 4 }, left: PAD + SHADOW_OFFSET, top: PAD + SHADOW_OFFSET }])
  .blur(SHADOW_BLUR)
  .png()
  .toBuffer();

// 5) 合成：白晕边（底）→ 深色投影 → logo 本体（顶），再裁掉透明边
const compositeBuf = await sharp({
  create: { width: width + PAD * 2, height: height + PAD * 2, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
})
  .composite([
    { input: whiteHaloLayer, left: 0, top: 0 },
    { input: shadowLayer, left: 0, top: 0 },
    { input: logoColor, raw: { width, height, channels: 4 }, left: PAD, top: PAD },
  ])
  .png()
  .toBuffer();

// 6) trim 去掉透明边，让 logo 在画布中居中，便于精准定位叠加
await sharp(compositeBuf).trim().png().toFile(OUTPUT);

const outMeta = await sharp(OUTPUT).metadata();
console.log(`✅ 水印已处理：${OUTPUT} (${outMeta.width}x${outMeta.height}) — 白晕边+暗投影双对比`);
