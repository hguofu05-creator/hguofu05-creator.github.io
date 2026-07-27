/**
 * 照片数据与辅助函数。
 * photos.json 由 scripts/process-images.mjs 自动生成（含 EXIF）。
 * 你只需要在 photos.json 里补充：title（标题）、category（分类）、story（拍摄故事）、location（地点）。
 */
import raw from '../data/photos.json';

export interface Exif {
  /** 仅保留 ISO 与光圈（手机照片通常只有这两项可靠） */
  iso?: string;
  aperture?: string;
}

export interface Photo {
  /** 唯一 ID（来自文件名，用作详情页网址） */
  id: string;
  /** 图片基路径，如 images/photos/IMG_2024... （不带尺寸和后缀） */
  src: string;
  /** 原图宽 / 高（用于占位避免抖动） */
  width: number;
  height: number;
  /** 实际已生成的尺寸列表（与生成脚本一致） */
  sizes: number[];
  /** 标题 */
  title: string;
  /** 分类：mountain 山岳 / water 水域 / forest 森林 / city 城市 / people 人文 */
  category: 'mountain' | 'water' | 'forest' | 'city' | 'people';
  /** 拍摄故事 */
  story: string;
  /** 地点 */
  location: string;
  /** 拍摄日期 YYYY-MM-DD */
  date: string;
  /** 是否首页精选 */
  featured: boolean;
  /** 是否作为首页 Hero 大图 */
  cover: boolean;
  /** EXIF 信息 */
  exif: Exif;
}

export const photos = raw as Photo[];

/** 可选尺寸（与生成脚本保持一致） */
export const SIZES = [400, 800, 1600] as const;

/** 拼接某个尺寸的绝对路径，例如 /images/photos/xxx-800.webp */
export function photoUrl(p: Photo, size: number): string {
  return `/${p.src}-${size}.webp`;
}

/** 生成 srcset（用实际已生成的尺寸） */
export function srcSet(p: Photo): string {
  return p.sizes.map((s) => `${photoUrl(p, s)} ${s}w`).join(', ');
}

/** 默认展示用的图（优先 800，否则最大可用尺寸） */
export function defaultSrc(p: Photo): string {
  const size = p.sizes.includes(800) ? 800 : p.sizes[p.sizes.length - 1];
  return photoUrl(p, size);
}

/** 首图（用于 Hero / 兜底） */
export function coverPhoto(): Photo {
  return photos.find((p) => p.cover) ?? photos[0];
}

/** 分类定义（作品集页筛选按钮） */
export const CATEGORIES = [
  { key: 'all', label: '全部' },
  { key: 'nature', label: '自然' }, // 自然 = 山岳 + 水域 + 森林
  { key: 'mountain', label: '山岳' },
  { key: 'water', label: '水域' },
  { key: 'forest', label: '森林' },
  { key: 'city', label: '城市' },
  { key: 'people', label: '人文' },
] as const;

export type CategoryKey = (typeof CATEGORIES)[number]['key'];

/** 按分类筛选用，规则：all=全部，nature=山岳/水域/森林，其余精确匹配 */
export function filterPhotos(key: CategoryKey): Photo[] {
  if (key === 'all') return photos;
  if (key === 'nature') return photos.filter((p) => ['mountain', 'water', 'forest'].includes(p.category));
  return photos.filter((p) => p.category === key);
}

/** 首页精选（最多 count 张） */
export function featuredPhotos(count = 12): Photo[] {
  const f = photos.filter((p) => p.featured);
  return (f.length ? f : photos).slice(0, count);
}
