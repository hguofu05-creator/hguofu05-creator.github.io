// @ts-check
import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';

// 👉 把下面 site 改成你的 GitHub Pages 地址。
//    推荐用「用户页」：仓库名叫 <你的用户名>.github.io，
//    那样网站地址就是 https://<你的用户名>.github.io ，base 保持默认即可。
export default defineConfig({
  site: 'https://hguofu05-creator.github.io',

  // 如果你用的是「项目页」（仓库名不是 <用户名>.github.io）：
  // 1) 把上面的 site 改成 https://<用户名>.github.io/<仓库名>/
  // 2) 取消下面这行的注释，把 repo 改成你的仓库名
  // base: '/repo/',

  integrations: [tailwind()],

  build: {
    // 用扁平 .html 输出，兼容「只服务显式文件」的静态服务器（CloudStudio / GitHub Pages 均可）
    format: 'file',
  },
  // 关闭 Astro 自带的图片服务（我们用自己生成的 WebP，无需 astro:assets）
  image: { service: { entrypoint: undefined } },
});
