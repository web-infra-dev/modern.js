import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

// Release gate for the docs bundled into @modern-js/app-tools: the tarball
// must contain every page the docs site emitted, plus llms.txt, within the
// size limit. Deliberately deterministic — whether a page renders completely
// is the docs site's job. Run after `pnpm build:docs`.
const repoRoot = path.resolve(__dirname, '../../..');
const docsBuild = path.join(repoRoot, 'packages/document/doc_build');
const appTools = path.join(repoRoot, 'packages/solutions/app-tools');

const SIZE_LIMIT = 2 * 1024 * 1024;

interface PackedFile {
  path: string;
  size: number;
}

if (!fs.existsSync(docsBuild)) {
  console.error(`[check-doc-bundle] docs site output not found: ${docsBuild}`);
  console.error('[check-doc-bundle] run `pnpm build:docs` first');
  process.exit(1);
}

// Expected pages: the English Markdown emitted by the docs site.
const expected = fs
  .readdirSync(docsBuild, { recursive: true, withFileTypes: true })
  .filter(entry => entry.isFile() && entry.name.endsWith('.md'))
  .filter(entry => {
    const rel = path.relative(
      docsBuild,
      path.join(entry.parentPath ?? entry.path, entry.name),
    );
    return !rel.startsWith(`zh${path.sep}`);
  }).length;

execSync('node ./bin/modern-bundle-docs.js', {
  cwd: appTools,
  stdio: 'inherit',
});
const packJson = JSON.parse(
  execSync('npm pack --dry-run --json', { cwd: appTools, encoding: 'utf-8' }),
) as { files: PackedFile[] }[];
const bundled = packJson[0].files.filter(f => f.path.startsWith('docs/'));
const pages = bundled.filter(f => f.path.endsWith('.md'));

if (pages.length !== expected) {
  console.error(
    `[check-doc-bundle] tarball has ${pages.length} pages, docs site emitted ${expected}`,
  );
  process.exit(1);
}
if (!bundled.some(f => f.path === 'docs/llms.txt')) {
  console.error('[check-doc-bundle] docs/llms.txt is missing from the tarball');
  process.exit(1);
}

const bundleSize = bundled.reduce((sum, f) => sum + f.size, 0);
if (bundleSize > SIZE_LIMIT) {
  console.error(
    `[check-doc-bundle] bundle size ${bundleSize} exceeds limit ${SIZE_LIMIT}`,
  );
  process.exit(1);
}

console.log(
  `[check-doc-bundle] OK — ${pages.length} pages + llms.txt, ${(bundleSize / 1024 / 1024).toFixed(2)}MB`,
);
