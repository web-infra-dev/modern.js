// Fixture integrity for the A/B experiment.
// Usage:
//   node fixture.mjs manifest              — write manifest.json (template project files + shared docs)
//   node fixture.mjs verify-pre <runDir>   — run dir project files match manifest (before agent starts)
//   node fixture.mjs verify-shared         — shared node_modules docs unchanged (after runs)
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEMPLATE = path.join(__dirname, 'template/demo-app');
const DOCS = path.join(TEMPLATE, 'node_modules/@modern-js/app-tools/main-doc');
const MANIFEST = path.join(__dirname, 'manifest.json');

const sha = p =>
  crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');

function walk(root, skip = []) {
  const out = {};
  const rec = dir => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, e.name);
      const rel = path.relative(root, full);
      if (skip.some(s => rel === s || rel.startsWith(s + path.sep))) continue;
      if (e.isSymbolicLink()) continue;
      if (e.isDirectory()) rec(full);
      else out[rel] = sha(full);
    }
  };
  rec(root);
  return out;
}

const TEMPLATE_A = path.join(__dirname, 'template/demo-app-prod-a');

function pkgVersions(tplRoot) {
  const scope = path.join(tplRoot, 'node_modules/@modern-js');
  const out = {};
  if (!fs.existsSync(scope)) return out;
  for (const name of fs.readdirSync(scope)) {
    try {
      out[name] = JSON.parse(
        fs.readFileSync(path.join(scope, name, 'package.json'), 'utf-8'),
      ).version;
    } catch {}
  }
  return out;
}

const cmd = process.argv[2];
if (cmd === 'manifest') {
  const m = {
    createdAt: new Date().toISOString(),
    project: walk(TEMPLATE, ['node_modules']),
    projectA: walk(TEMPLATE_A, ['node_modules']),
    sharedDocs: walk(DOCS),
    variants: walk(path.join(__dirname, 'production-variants')),
    armTrees: {
      'PROD-B': {
        mainDocPresent: true,
        modernPkgVersions: pkgVersions(TEMPLATE),
      },
      'PROD-A': {
        mainDocPresent: fs.existsSync(
          path.join(TEMPLATE_A, 'node_modules/@modern-js/app-tools/main-doc'),
        ),
        modernPkgVersions: pkgVersions(TEMPLATE_A),
      },
    },
  };
  fs.writeFileSync(MANIFEST, JSON.stringify(m, null, 1));
  console.log(
    `manifest: ${Object.keys(m.project).length} project files, ${Object.keys(m.sharedDocs).length} doc files, ${Object.keys(m.variants).length} variant files`,
  );
} else if (cmd === 'verify-pre') {
  const runDir = process.argv[3];
  const m = JSON.parse(fs.readFileSync(MANIFEST, 'utf-8'));
  let bad = 0;
  for (const [rel, h] of Object.entries(m.project)) {
    // AGENTS.md/CLAUDE.md are replaced per group — checked against variants instead
    if (rel === 'AGENTS.md' || rel === 'CLAUDE.md') continue;
    const p = path.join(runDir, rel);
    if (!fs.existsSync(p) || sha(p) !== h) {
      console.error(`MISMATCH ${rel}`);
      bad++;
    }
  }
  console.log(
    bad === 0 ? 'PRE-RUN FIXTURE OK' : `PRE-RUN FIXTURE BAD (${bad})`,
  );
  process.exit(bad === 0 ? 0 : 1);
} else if (cmd === 'verify-shared') {
  const m = JSON.parse(fs.readFileSync(MANIFEST, 'utf-8'));
  const now = walk(DOCS);
  const a = JSON.stringify(m.sharedDocs);
  const b = JSON.stringify(now);
  console.log(a === b ? 'SHARED DOCS UNCHANGED' : 'SHARED DOCS MUTATED!');
  process.exit(a === b ? 0 : 1);
} else {
  console.error('usage: manifest | verify-pre <runDir> | verify-shared');
  process.exit(2);
}
