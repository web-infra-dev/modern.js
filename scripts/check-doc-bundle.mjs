import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Validates the docs bundle that ships inside the @modern-js/app-tools tarball
// (created by packages/solutions/app-tools/scripts/copy-docs.mjs):
//   1. the tarball actually contains the docs, and llms.txt as an index
//   2. the bundled page count matches the docs site build output
//   3. the pages are self-contained — no unresolved doc-site imports or aliases
//   4. bundle size stays under the threshold
//
// Run it after building the docs site (`pnpm build:docs`); it is the gate that
// keeps a release from shipping without, or with a stale, docs bundle.
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');
const docsBuild = path.join(repoRoot, 'packages/document/doc_build');
const appTools = path.join(repoRoot, 'packages/solutions/app-tools');

const SIZE_LIMIT = 2 * 1024 * 1024;
// Imports that would mean the page still depends on the docs site to render.
const UNRESOLVED_IMPORT =
  /^import\s.*\sfrom\s+'(@site-docs[^']*|@theme|@site\/[^']*)'/m;
// A component tag that survived the build renders as literal text for an
// agent, so its content never reaches the bundle. The build strips the
// imports, which is why checking those alone is not enough.
//
// Only self-closing tags or tags with attributes count: bare `<Name>` also
// appears inside type signatures like `Promise<RsbuildConfig>`, which is prose,
// not an unrendered component.
const UNRENDERED_COMPONENT =
  /<(ReleaseNote|PackageManagerTabs|RsbuildConfig|OverviewCard|SourceCode)(\s[^>]*)?\/>/;
// Fenced code blocks legitimately show component usage as sample markup.
const stripFences = content =>
  content.replace(/^(`{3,4})[^\n]*\n[\s\S]*?^\1/gm, '');

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

execSync('node ./scripts/copy-docs.mjs', {
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

// The bundled pages must be readable on their own: the docs site renders
// components and inlines shared fragments at build time, so any leftover import
// of a doc-site alias means an agent would hit content that never ships.
let unresolved = 0;
for (const file of pages) {
  const content = fs.readFileSync(path.join(appTools, file.path), 'utf-8');
  const importMatch = content.match(UNRESOLVED_IMPORT);
  if (importMatch) {
    console.error(
      `[check-doc-bundle] unresolved doc-site import in ${file.path}: ${importMatch[1]}`,
    );
    unresolved++;
  }
  const componentMatch = stripFences(content).match(UNRENDERED_COMPONENT);
  if (componentMatch) {
    console.error(
      `[check-doc-bundle] unrendered component in ${file.path}: <${componentMatch[1]}>`,
    );
    unresolved++;
  }
}
if (unresolved > 0) {
  process.exit(1);
}

console.log(
  `[check-doc-bundle] OK — ${pages.length} pages + llms.txt, ${(bundleSize / 1024 / 1024).toFixed(2)}MB, all pages self-contained`,
);
