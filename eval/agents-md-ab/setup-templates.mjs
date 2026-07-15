// Materializes the two experiment templates into the EXPOSED root from the
// committed inputs (template-src/ + docs-snapshot/), then verifies the result
// against the committed manifest.json. This makes the frozen commit fully
// self-contained: checkout → node setup-templates.mjs → node test-graders.mjs.
//
//   EXPOSED root (default /tmp/modernjs-ab-exposed, env AB_EXPOSED_ROOT):
//     templates/demo-app          — PROD-B tree (bundled docs injected)
//     templates/demo-app-prod-a   — PROD-A tree (no bundled docs)
//     runs/                       — created by runner2 at run time
//
// Isolation invariant: nothing under EXPOSED references this (private)
// directory — agents running in runs/ cannot reach graders/banks by
// traversing parents or resolving the node_modules symlink.
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const EXPOSED = process.env.AB_EXPOSED_ROOT ?? '/tmp/modernjs-ab-exposed';
const PNPM = 'npx pnpm@10.13.1';
const REGISTRY = process.env.AB_NPM_REGISTRY ?? 'https://registry.npmmirror.com';

const src = name => path.join(__dirname, 'template-src', name);
const dst = name => path.join(EXPOSED, 'templates', name);

fs.mkdirSync(path.join(EXPOSED, 'templates'), { recursive: true });

for (const name of ['demo-app', 'demo-app-prod-a']) {
  const d = dst(name);
  fs.rmSync(d, { recursive: true, force: true });
  fs.cpSync(src(name), d, { recursive: true });
  console.log(`[setup] installing ${name} (pnpm 10.13.1, frozen lockfile)...`);
  execSync(`${PNPM} install --frozen-lockfile --registry=${REGISTRY}`, {
    cwd: d,
    stdio: 'pipe',
    env: { ...process.env, CI: 'true' },
  });
}

// inject the committed docs snapshot into the PROD-B tree only
const docsTarget = path.join(
  dst('demo-app'),
  'node_modules/@modern-js/app-tools/main-doc',
);
fs.rmSync(docsTarget, { recursive: true, force: true });
fs.cpSync(path.join(__dirname, 'template-src/docs-snapshot'), docsTarget, {
  recursive: true,
});

// reproducibility gate: result must hash-match the committed manifest
const out = execSync(`node ${path.join(__dirname, 'fixture.mjs')} check-manifest`, {
  encoding: 'utf-8',
  env: { ...process.env, AB_EXPOSED_ROOT: EXPOSED },
});
process.stdout.write(out);
console.log('[setup] done');
