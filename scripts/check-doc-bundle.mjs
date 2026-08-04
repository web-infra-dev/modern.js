import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Validates the docs bundle that ships inside the @modern-js/app-tools tarball
// (created by packages/solutions/app-tools/src/bundleDocs.ts):
//   1. the tarball actually contains the docs, and llms.txt as an index
//   2. the bundled page count matches the docs site build output
//   3. bundle size stays under the threshold
//
// Deliberately limited to what can be checked deterministically. Whether a
// page renders completely is the docs site's job — inferring it from the
// output text needs a parser for the whole MDX surface, and every
// approximation of that either misses real breakage or blocks releases on
// false positives.
//
// Run it after building the docs site (`pnpm build:docs`); it is the gate that
// keeps a release from shipping without, or with a stale, docs bundle.
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');
const docsBuild = path.join(repoRoot, 'packages/document/doc_build');
const appTools = path.join(repoRoot, 'packages/solutions/app-tools');

const SIZE_LIMIT = 2 * 1024 * 1024;
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
);
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
