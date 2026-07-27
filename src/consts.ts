/**
 * 站点全局配置 —— 改这里就能改全站信息。
 * 注意：这是 .ts 文件，字符串用单引号/双引号都可以，但末尾别加逗号以外的多余符号。
 */

export const SITE = {
  /** 你的名字（显示在首页 Hero 和标题） */
  name: 'Leo',

  /** 副标题（Hero 下面那行小字） */
  subtitle: '自然风光 · 人文纪实摄影',

  /** 联系邮箱（联系页显示） */
  email: '15889902802@163.com',

  /** 社交媒体链接（联系页 + 页脚显示）。不需要的删掉整行即可。
   *  现在先放平台官网；想换成自己的主页链接时，直接把 url 改成你的个人主页即可。
   */
  socials: [
    { name: '抖音', url: 'https://www.douyin.com' },
    { name: 'B站', url: 'https://www.bilibili.com' },
    { name: '小红书', url: 'https://www.xiaohongshu.com' },
  ],

  /** 关于页：摄影师头像。默认使用 public/images/about.webp；
   *  想换头像时，直接把任意图片覆盖到 public/images/about.webp 即可。
   */
  avatar: '/images/about.webp',

  /** 关于页：一段自我介绍（支持多段，用数组） */
  bio: [
    '我是一名热爱自然的摄影爱好者，习惯在清晨与黄昏出发，追逐山脊上的第一缕光。',
    '拍摄之外，我也记录旅途中的人与市井，相信风光与人文本就是同一片土地的两面。',
  ],

  /** 关于页：设备清单 */
  gear: [
    '相机：Sony A7 IV',
    '主力镜头：FE 24-70mm F2.8 GM',
    '长焦：FE 100-400mm F4.5-5.6 GM',
    '三脚架：捷信 GT1545T',
    '偶尔用手机：Xiaomi 15',
  ],

  /** 版权年份（自动用当前年也行，这里写死避免构建差异） */
  year: new Date().getFullYear(),
};

/** 导航菜单 */
export const NAV = [
  { label: '首页', href: '/' },
  { label: '作品集', href: '/gallery.html' },
  { label: '关于', href: '/about.html' },
  { label: '联系', href: '/contact.html' },
];
