/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,ts,tsx,md,mdx}'],
  theme: {
    extend: {
      // —— 影视飓风风格配色（来自你的要求）——
      colors: {
        bg: 'oklch(0.15 0 0)',       // 主背景：接近纯黑
        'bg-2': 'oklch(0.22 0 0)',   // 次背景：深灰
        fg: 'oklch(0.95 0 0)',       // 主文字：亮白
        muted: 'oklch(0.65 0.01 260)',// 次文字：冷灰
        accent: 'oklch(0.75 0.15 240)',// 强调色：克制的蓝
      },
      fontFamily: {
        serif: ['"Noto Serif SC"', 'Georgia', 'serif'],
        sans: ['"Noto Sans SC"', 'system-ui', 'sans-serif'],
      },
      maxWidth: {
        prose: '68ch',
      },
    },
  },
  plugins: [],
};
