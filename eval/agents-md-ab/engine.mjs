// Unified grading engine for the Modern.js A/B experiment.
//
// Usage: node engine.mjs <bankFile> <taskId> <runDir> [--json]
//
// Prints one JSON object to stdout:
//   { task, pass, abstained, reason, checks: [{ name, ok, detail }] }
// Exit code: 0 = pass, 1 = fail, 2 = engine/usage error.
//
// Per-task check functions live in graders/<taskId>.mjs (one file per task,
// hand-translated from the bank's grader_spec.rules — the executable form of
// the rules). The engine provides executors for the five grader types:
//   file_ast         → read / exists / stripComments / extractBlock / findFiles
//   build_check      → ctx.build()  (pnpm build, cache-cleaned, 5 min timeout)
//   html_check       → ctx.htmlFiles() over built output dirs
//   http_check       → ctx.withServer()  (pnpm serve on a random port + fetch)
//   answer_keywords  → ctx.answer()  (ANSWER.md, else .final-answer.txt)
//
// The engine and graders/ live OUTSIDE any run directory tree so agents can
// never discover the grading logic from inside their runDir.

import { execSync, spawn, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const argv = process.argv.slice(2);
const jsonOnly = argv.includes('--json');
const [bankFile, taskId, runDirArg] = argv.filter(a => a !== '--json');

if (!bankFile || !taskId || !runDirArg) {
  console.error('usage: node engine.mjs <bankFile> <taskId> <runDir> [--json]');
  process.exit(2);
}

const runDir = path.resolve(runDirArg);
const bankPath = path.isAbsolute(bankFile)
  ? bankFile
  : path.resolve(__dirname, bankFile);
const bank = JSON.parse(fs.readFileSync(bankPath, 'utf8'));
const task = (bank.tasks || []).find(t => t.id === taskId);
if (!task) {
  console.error(`task ${taskId} not found in ${bankFile}`);
  process.exit(2);
}
if (!fs.existsSync(runDir)) {
  console.error(`runDir not found: ${runDir}`);
  process.exit(2);
}

const graderPath = path.join(__dirname, 'graders', `${taskId}.mjs`);
if (!fs.existsSync(graderPath)) {
  console.error(`grader not found: ${graderPath}`);
  process.exit(2);
}

// ---------------------------------------------------------------------------
// Shared executors / helpers exposed to graders
// ---------------------------------------------------------------------------

const sleep = ms => new Promise(r => setTimeout(r, ms));

const BUILD_TIMEOUT_MS = 5 * 60 * 1000;
const SERVE_READY_TIMEOUT_MS = 30 * 1000;
const OUTPUT_DIRS = ['dist', 'build', 'build_output'];

function makeCtx() {
  const ctx = {
    runDir,
    task,
    bank,

    // --- file_ast helpers ---------------------------------------------------
    read(rel) {
      try {
        return fs.readFileSync(path.join(runDir, rel), 'utf8');
      } catch {
        return null;
      }
    },
    exists(rel) {
      return fs.existsSync(path.join(runDir, rel));
    },
    stripComments(s) {
      return (s ?? '')
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/^\s*\/\/.*$/gm, '')
        .replace(/([^:'"\\])\/\/[^\n'"]*$/gm, '$1');
    },
    // Extract the body of `key: { ... }` (balanced braces) from source text.
    // Returns null when not found. keyPath may be nested: extractBlock(src, 'server')
    // then extractBlock(serverBlock, 'ssr').
    extractBlock(src, key) {
      if (!src) return null;
      const re = new RegExp(
        `\\b${key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*:\\s*\\{`,
      );
      const m = re.exec(src);
      if (!m) return null;
      let i = m.index + m[0].length;
      let depth = 1;
      const start = i;
      while (i < src.length && depth > 0) {
        const ch = src[i];
        if (ch === '{') depth++;
        else if (ch === '}') depth--;
        i++;
      }
      return src.slice(start, i - 1);
    },
    // Recursive file listing relative to runDir; pred receives the relative
    // posix path. Skips node_modules and output/cache dirs by default.
    findFiles(pred, { includeOutputs = false, root = '.' } = {}) {
      const skip = new Set(['node_modules', '.git', '.cache']);
      if (!includeOutputs) for (const d of OUTPUT_DIRS) skip.add(d);
      const out = [];
      const rec = dir => {
        let entries;
        try {
          entries = fs.readdirSync(dir, { withFileTypes: true });
        } catch {
          return;
        }
        for (const e of entries) {
          if (skip.has(e.name)) continue;
          const full = path.join(dir, e.name);
          const rel = path.relative(runDir, full).split(path.sep).join('/');
          if (e.isSymbolicLink()) continue;
          if (e.isDirectory()) rec(full);
          else if (pred(rel)) out.push(rel);
        }
      };
      rec(path.join(runDir, root));
      return out;
    },
    // Compare project files against the frozen template manifest.
    // Returns { modified: [], added: [], removed: [] } (relative paths).
    changedFiles() {
      const manifest = JSON.parse(
        fs.readFileSync(path.join(__dirname, 'manifest.json'), 'utf8'),
      );
      const ignore = rel =>
        rel === 'AGENTS.md' ||
        rel === 'CLAUDE.md' ||
        rel === 'ANSWER.md' ||
        rel === '.final-answer.txt' ||
        rel.startsWith('.modern-js/') ||
        rel.startsWith('.claude/') ||
        rel.endsWith('.log');
      const crypto = require$crypto();
      const sha = p =>
        crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
      const current = {};
      for (const rel of ctx.findFiles(() => true)) {
        if (ignore(rel)) continue;
        current[rel] = sha(path.join(runDir, rel));
      }
      const modified = [];
      const added = [];
      const removed = [];
      for (const [rel, h] of Object.entries(manifest.project)) {
        if (ignore(rel)) continue;
        if (!(rel in current)) removed.push(rel);
        else if (current[rel] !== h) modified.push(rel);
      }
      for (const rel of Object.keys(current)) {
        if (!(rel in manifest.project)) added.push(rel);
      }
      return { modified, added, removed };
    },

    // --- answer_keywords executor --------------------------------------------
    // ANSWER.md if present, else .final-answer.txt (runner-captured final
    // agent reply). Returns { text, source } or null when neither exists.
    answer() {
      for (const f of ['ANSWER.md', '.final-answer.txt']) {
        const p = path.join(runDir, f);
        if (fs.existsSync(p))
          return { text: fs.readFileSync(p, 'utf8'), source: f };
      }
      return null;
    },
    // Line-level trap helper: does any line recommend a command matching
    // cmdRe without removal/negation context (negRe) on the same line?
    recommendsWithoutNegation(text, cmdRe, negRe) {
      return (text || '')
        .split('\n')
        .some(l => cmdRe.test(l) && !negRe.test(l));
    },

    // --- build_check executor -------------------------------------------------
    // Memoized. Deletes the SHARED node_modules/.cache (runDir/node_modules is
    // a symlink into the template — resolve realpath, verify basename, delete
    // ONLY .cache) and stale output dirs, then runs `pnpm build` (5 min cap).
    _buildResult: null,
    async build() {
      if (ctx._buildResult) return ctx._buildResult;
      const nm = path.join(runDir, 'node_modules');
      try {
        const real = fs.realpathSync(nm);
        if (path.basename(real) === 'node_modules') {
          fs.rmSync(path.join(real, '.cache'), {
            recursive: true,
            force: true,
          });
        }
      } catch {}
      for (const d of OUTPUT_DIRS) {
        fs.rmSync(path.join(runDir, d), { recursive: true, force: true });
      }
      // --config.verify-deps-before-run=false: plain `pnpm build` on a
      // symlinked node_modules triggers a modules-dir purge + reinstall
      // (destructive to the shared template install). Verified empirically.
      const r = spawnSync(
        'pnpm',
        ['--config.verify-deps-before-run=false', 'run', 'build'],
        { cwd: runDir, encoding: 'utf8', timeout: BUILD_TIMEOUT_MS },
      );
      const out = (r.stdout || '') + (r.stderr || '');
      ctx._buildResult = {
        ok: r.status === 0,
        code: r.status,
        timedOut: r.signal != null,
        tail: out.slice(-1200),
      };
      return ctx._buildResult;
    },

    // --- html_check executor --------------------------------------------------
    htmlFiles() {
      const out = [];
      for (const d of OUTPUT_DIRS) {
        const rootAbs = path.join(runDir, d);
        if (!fs.existsSync(rootAbs)) continue;
        const rec = dir => {
          for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
            const full = path.join(dir, e.name);
            if (e.isDirectory()) rec(full);
            else if (e.name.endsWith('.html'))
              out.push(path.relative(runDir, full).split(path.sep).join('/'));
          }
        };
        rec(rootAbs);
      }
      return out;
    },

    // --- http_check executor ----------------------------------------------------
    // Starts `PORT=<random 40000-49999> pnpm serve` detached, polls readiness
    // (≤30 s), hands a fetch helper to fn, then kills the whole process tree
    // (process-group SIGKILL + lsof-by-port fallback).
    async withServer(fn) {
      const port = 40000 + Math.floor(Math.random() * 10000);
      const child = spawn(
        'pnpm',
        ['--config.verify-deps-before-run=false', 'run', 'serve'],
        {
          cwd: runDir,
          env: { ...process.env, PORT: String(port) },
          detached: true,
          stdio: ['ignore', 'pipe', 'pipe'],
        },
      );
      let log = '';
      child.stdout.on('data', d => (log += d));
      child.stderr.on('data', d => (log += d));
      const base = `http://127.0.0.1:${port}`;
      let ready = false;
      const t0 = Date.now();
      while (Date.now() - t0 < SERVE_READY_TIMEOUT_MS) {
        if (child.exitCode !== null) break;
        try {
          await fetch(`${base}/`, { signal: AbortSignal.timeout(2000) });
          ready = true;
          break;
        } catch {}
        await sleep(500);
      }
      const get = async p => {
        const r = await fetch(base + p, {
          signal: AbortSignal.timeout(8000),
          redirect: 'manual',
        });
        return { status: r.status, text: await r.text(), headers: r.headers };
      };
      try {
        return await fn({
          port,
          base,
          ready,
          get,
          log: () => log.slice(-1200),
        });
      } finally {
        try {
          process.kill(-child.pid, 'SIGKILL');
        } catch {}
        try {
          // -sTCP:LISTEN: only the server (a bare -i:PORT would also match the
          // engine's own keep-alive fetch connection and SIGKILL ourselves).
          execSync(
            `lsof -t -iTCP:${port} -sTCP:LISTEN 2>/dev/null | xargs -r kill -9`,
            {
              stdio: 'ignore',
              shell: '/bin/bash',
            },
          );
        } catch {}
      }
    },
  };
  return ctx;
}

// lazy require for crypto inside ESM helper above
import crypto from 'node:crypto';
function require$crypto() {
  return crypto;
}

// ---------------------------------------------------------------------------
// Run the grader
// ---------------------------------------------------------------------------

// Grader contract: default export async (ctx, c) where c is the check
// collector: c.add(name, ok, detail) → boolean ok. May set c.abstained
// (L4 tasks only). Returning early is fine; result is read from c.
function makeCollector() {
  const checks = [];
  return {
    checks,
    abstained: false,
    add(name, ok, detail = '') {
      checks.push({ name, ok: !!ok, detail: String(detail ?? '') });
      return !!ok;
    },
  };
}

const mod = await import(pathToFileURL(graderPath).href);
const ctx = makeCtx();
const c = makeCollector();

let engineError = null;
try {
  await mod.default(ctx, c);
} catch (e) {
  engineError = e;
  c.add(
    'grader-crashed',
    false,
    (e?.stack ? e.stack : String(e)).slice(0, 500),
  );
}

const pass = c.checks.length > 0 && c.checks.every(x => x.ok);
const firstFail = c.checks.find(x => !x.ok);
const result = {
  task: taskId,
  pass,
  abstained: !!c.abstained,
  reason: pass
    ? ''
    : firstFail
      ? `${firstFail.name}: ${firstFail.detail}`
      : 'no checks ran',
  checks: c.checks,
};

console.log(JSON.stringify(result));
if (!jsonOnly) {
  for (const ch of c.checks) {
    console.error(
      `  [${ch.ok ? 'ok' : 'FAIL'}] ${ch.name}${ch.detail ? ` — ${ch.detail}` : ''}`,
    );
  }
  console.error(
    `${taskId}: ${pass ? 'PASS' : 'FAIL'}${result.abstained ? ' (abstained)' : ''}${
      pass ? '' : ` — ${result.reason}`
    }`,
  );
}
process.exit(engineError ? 1 : pass ? 0 : 1);
