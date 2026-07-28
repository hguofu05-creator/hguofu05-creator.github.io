// 部署脚本：构建并把 dist/ 推到 GitHub 用户页的 main 分支根目录（GitHub Pages legacy 部署）。
// 用法： GITHUB_TOKEN=ghp_xxx node scripts/deploy.mjs
// 说明：当前 PAT 仅 repo 权限，无法用 Actions 工作流，故采用「分支部署」：main=构建产物，source=源代码。
import { execSync } from 'node:child_process';
import { rmSync, mkdirSync, cpSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const TOKEN = process.env.GITHUB_TOKEN;
if (!TOKEN) {
  console.error('缺少环境变量 GITHUB_TOKEN。请先设置经典令牌(含 repo 权限)：');
  console.error('  $env:GITHUB_TOKEN="ghp_xxx" ; node scripts/deploy.mjs');
  process.exit(1);
}
const OWNER = 'hguofu05-creator';
const REPO = 'hguofu05-creator.github.io';
const root = process.cwd();
const DIST = join(root, 'dist');
const tmp = join(root, '.deploy-tmp');

console.log('1) 构建站点...');
execSync('node node_modules/astro/astro.js build', { cwd: root, stdio: 'inherit' });

console.log('2) 添加 .nojekyll（禁用 Jekyll，防止 _astro 资源被忽略）...');
writeFileSync(join(DIST, '.nojekyll'), 'Disable Jekyll so _astro assets are published.\n', 'utf8');

console.log('3) 复制 dist 到临时仓库...');
rmSync(tmp, { recursive: true, force: true });
mkdirSync(tmp, { recursive: true });
cpSync(DIST, tmp, { recursive: true });

console.log('4) 提交并推送到 origin/main (强制覆盖构建产物)...');
execSync('git init -q && git checkout -q -b main && git add -A && git -c user.email=leo@portfolio.local -c user.name=Leo commit -q -m "deploy: built site"', { cwd: tmp, stdio: 'inherit' });
execSync(`git remote add origin https://${OWNER}:${TOKEN}@github.com/${OWNER}/${REPO}.git`, { cwd: tmp, stdio: 'inherit' });
execSync('git push -u origin main --force', { cwd: tmp, stdio: 'inherit' });

rmSync(tmp, { recursive: true, force: true });
console.log(`\n✅ 部署完成：https://${REPO}`);
