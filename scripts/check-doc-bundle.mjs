import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Validates the docs bundle that ships inside the @modern-js/app-tools
// tarball (created by packages/solutions/app-tools/scripts/copy-main-doc.mjs):
//   1. file count in the tarball matches packages/document/docs/en
//   2. every `@site-docs-en/*` import used by the docs resolves inside the bundle
//   3. bundle size stays under the threshold
// Relative imports that point outside the docs tree (currently only the
// csr-auth tutorial's sandbox sources) are intentionally not bundled and
// are whitelisted here.
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');
const docsSource = path.join(repoRoot, 'packages/document/docs/en');
const appTools = path.join(repoRoot, 'packages/solutions/app-tools');

const SIZE_LIMIT = 2 * 1024 * 1024;
const OUTSIDE_DOCS_WHITELIST = [/\.\.\/.*src\/sandbox\//];
// must stay in sync with EXCLUDED_SECTIONS in
// packages/solutions/app-tools/scripts/copy-main-doc.mjs
const EXCLUDED_SECTIONS = ['community', 'tutorials', 'plugin'];

const sourceFiles = fs
  .readdirSync(docsSource, { recursive: true, withFileTypes: true })
  .filter(entry => entry.isFile())
  .filter(entry => {
    const rel = path.relative(
      docsSource,
      path.join(entry.parentPath ?? entry.path, entry.name),
    );
    return !EXCLUDED_SECTIONS.includes(rel.split(path.sep)[0]);
  });

// 1 & 3: inspect the tarball file list
execSync('node ./scripts/copy-main-doc.mjs', {
  cwd: appTools,
  stdio: 'inherit',
});
const packJson = JSON.parse(
  execSync('npm pack --dry-run --json', { cwd: appTools, encoding: 'utf-8' }),
);
const bundled = packJson[0].files.filter(f => f.path.startsWith('docs/'));
if (bundled.length !== sourceFiles.length) {
  console.error(
    `[check-doc-bundle] tarball has ${bundled.length} doc files, source has ${sourceFiles.length}`,
  );
  process.exit(1);
}
const bundleSize = bundled.reduce((sum, f) => sum + f.size, 0);
if (bundleSize > SIZE_LIMIT) {
  console.error(
    `[check-doc-bundle] bundle size ${bundleSize} exceeds limit ${SIZE_LIMIT}`,
  );
  process.exit(1);
}

// 2: alias imports must resolve inside the bundle
const importRegex = /from\s+'(@site-docs-en\/[^']+|\.{1,2}\/[^']+)'/g;
const bundledPaths = new Set(bundled.map(f => f.path));
const resolvesInBundle = spec => {
  const rel = spec.replace('@site-docs-en/', 'docs/');
  return [
    '',
    '.mdx',
    '.md',
    '.tsx',
    '.ts',
    '/index.mdx',
    '/index.tsx',
    '/index.ts',
  ].some(ext => bundledPaths.has(rel + ext));
};

let failed = 0;
for (const entry of sourceFiles) {
  if (!/\.mdx?$/.test(entry.name)) continue;
  const filePath = path.join(entry.parentPath ?? entry.path, entry.name);
  // strip fenced code blocks — import statements in code samples are not
  // real MDX imports and must not be validated
  const content = fs
    .readFileSync(filePath, 'utf-8')
    .replace(/^(`{3,4})[^\n]*\n[\s\S]*?^\1/gm, '');
  for (const match of content.matchAll(importRegex)) {
    const spec = match[1];
    if (spec.startsWith('@site-docs-en/')) {
      if (!resolvesInBundle(spec)) {
        console.error(
          `[check-doc-bundle] unresolvable import "${spec}" in ${filePath}`,
        );
        failed++;
      }
    } else if (!OUTSIDE_DOCS_WHITELIST.some(re => re.test(spec))) {
      // relative import — resolve against the file's own directory
      const relDir = path.relative(docsSource, path.dirname(filePath));
      const resolved = path
        .join('docs', relDir, spec)
        .replaceAll(path.sep, '/');
      if (!resolvesInBundle(resolved.replace('docs/', '@site-docs-en/'))) {
        console.error(
          `[check-doc-bundle] unresolvable relative import "${spec}" in ${filePath}`,
        );
        failed++;
      }
    }
  }
}
if (failed > 0) {
  process.exit(1);
}
console.log(
  `[check-doc-bundle] OK — ${bundled.length} files, ${(bundleSize / 1024 / 1024).toFixed(2)}MB, all imports resolvable`,
);
