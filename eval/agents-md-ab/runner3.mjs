// A/B experiment runner v3 — pre-registered execution protocol.
// Usage: node runner3.mjs --bank pilot-bank.json --arms PROD-A,PROD-B --reps 2 [--only T03] [--dry]
//
// v3 = v2 + strict-review gate items (experiment immutability, per-run audit,
// online-fetch evidence, run control hardening). runner2.mjs is kept untouched
// for comparison.
//
// Frozen protocol (changes require re-review):
//   - permission mode: --dangerously-skip-permissions (isolated throwaway dirs)
//   - max-turns 30, hard timeout 10min/run
//   - model pin: `--model claude-fable-5` passed explicitly AND verified from
//     stream-json init; a missing/empty init model field is a violation too —
//     any violation in a wave aborts the whole experiment (exit 3), rows kept
//   - tool surface pin: `--allowedTools` passed explicitly with the frozen
//     built-in default set (see ALLOWED_TOOLS below, matches RUN-PROTOCOL)
//   - child env allowlist: ONLY PATH/LANG/TERM/HTTPS_PROXY/HTTP_PROXY/NO_PROXY
//     are inherited; HOME is set to a per-run private-side temp copy; plus
//     npm_config_verify_deps_before_run=false. Nothing else leaks in.
//   - clean HOME per run: only auth credentials copied in; no user CLAUDE.md,
//     no memories, no MCP servers, no skills, no hooks. HOME lives OUTSIDE the
//     run dir (private side, tmp-homes/<experiment>/<run>) so neither the
//     audit snapshot nor fixture verify can ever touch credentials.
//   - experiment identity: experiment_id = <bank>-<UTC stamp>-<AB_COMMIT short
//     sha, 'dev' if unset>; ALL outputs go to private results/<experiment_id>/
//     (experiment.json, results.jsonl, audit/); refusing to start if that dir
//     already exists ⇒ results are append-only and never overwritten.
//     (AB_EXPERIMENT_ID env may pin the id — self-test hook only.)
//   - per-run audit archive: results/<exp>/audit/<arm>-<task>-r<rep>/ holds the
//     raw stream-json, stderr, exit code/duration meta, online-fetch evidence,
//     and a workspace/ snapshot taken immediately after the agent exits
//     (node_modules symlink and .home excluded — credentials NEVER enter audit;
//     a post-copy scan hard-fails on any .credentials.json / .home). Grading
//     runs on a scratch COPY of that snapshot (never the live run dir, never
//     the archive itself); the original run dir is deleted after snapshot.
//   - online-fetch evidence: every WebFetch (url, tool_result error flag,
//     response-byte estimate) and every Bash curl/wget (full command text,
//     extracted urls, result size) is archived per run; the experiment fetches
//     https://modernjs.dev/llms-full.txt + /llms.txt at start AND end, storing
//     sha256+bytes in audit/online-docs-baseline.json; any start/end mismatch
//     marks drift=true in experiment metadata.
//   - results manifest gate: at the end, results.jsonl is checked against the
//     pre-registered arm×task×rep grid — exactly one row per combination, no
//     dups/missing/extras — verdict written to manifest-check.json.
//   - wave blocking: wave = (task × rep); all arms run inside the same wave,
//     arm order shuffled per wave (seeded), workers = arms in parallel
//   - compliance (ITT): every run logs local-docs reads / online fetches
//     (WebFetch AND Bash curl/wget) — non-compliant runs are kept, flagged
//   - fixture: verify-pre before each run; shared-docs check after each wave
//   - grader mounted only AFTER the agent process exits (engine.mjs lives
//     outside the run tree); v3 grades a snapshot copy, not the run dir
//   - --dry is strictly zero-side-effect: no HOME build, no credential copy,
//     no directory creation, no network — plan is printed and nothing else
//   - isolation hook (reserved interface): if env AB_ISOLATE_CMD is set (e.g.
//     an unshare-based isolate-run.sh, built by a separate task), the claude
//     command is executed as `$AB_ISOLATE_CMD <claude-bin> <args...>` — the
//     wrapper receives the original command verbatim as its arguments. When
//     unset, the command is executed directly. The wrapper is recorded in
//     experiment.json and each run's run-meta.json.
//   - AB_CLAUDE_BIN overrides the claude binary (mock hook for self-tests;
//     falls back to CLAUDE_BIN, then ~/.npm-global/bin/claude).
import { execFileSync, spawn } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const EXPOSED = process.env.AB_EXPOSED_ROOT ?? '/tmp/modernjs-ab-exposed';
const CLAUDE_BIN =
  process.env.AB_CLAUDE_BIN ??
  process.env.CLAUDE_BIN ??
  path.join(os.homedir(), '.npm-global/bin/claude');
const ISOLATE_CMD = process.env.AB_ISOLATE_CMD ?? '';
const args = process.argv.slice(2);
const opt = (n, d) => {
  const i = args.indexOf(`--${n}`);
  return i >= 0 ? args[i + 1] : d;
};
const BANK_FILE = opt('bank', 'pilot-bank.json');
const ARMS = opt('arms', 'PROD-A,PROD-B').split(',');
const REPS = Number(opt('reps', '2'));
const ONLY = opt('only', '');
const DRY = args.includes('--dry');

const EXPECTED_MODEL = 'claude-fable-5';
const MAX_TURNS = '30';
const TIMEOUT_MS = 10 * 60 * 1000;
const SEED = 20260716;
// Frozen tool surface (RUN-PROTOCOL "工具面": the built-in default set, made
// explicit). Changing this list requires re-review.
const ALLOWED_TOOLS = Object.freeze(
  'Bash,Read,Write,Edit,Glob,Grep,WebFetch,WebSearch,TodoWrite,NotebookEdit',
);
// Frozen child-env allowlist — nothing else is inherited by the agent.
const CHILD_ENV_ALLOWLIST = Object.freeze([
  'PATH',
  'LANG',
  'TERM',
  'HTTPS_PROXY',
  'HTTP_PROXY',
  'NO_PROXY',
]);
const BASELINE_URLS = Object.freeze([
  'https://modernjs.dev/llms-full.txt',
  'https://modernjs.dev/llms.txt',
]);

// ---- experiment identity ----------------------------------------------------
const AB_COMMIT = (process.env.AB_COMMIT || 'dev').trim() || 'dev';
const UTC_STAMP = new Date()
  .toISOString()
  .replace(/[-:]/g, '')
  .replace(/\.\d+Z$/, 'Z');
const EXPERIMENT_ID =
  process.env.AB_EXPERIMENT_ID ??
  `${path.basename(BANK_FILE, '.json')}-${UTC_STAMP}-${AB_COMMIT}`;
const EXP_DIR = path.join(__dirname, 'results', EXPERIMENT_ID);
const AUDIT_DIR = path.join(EXP_DIR, 'audit');
const RESULTS_FILE = path.join(EXP_DIR, 'results.jsonl');
const EXP_META = path.join(EXP_DIR, 'experiment.json');
const BASELINE_FILE = path.join(AUDIT_DIR, 'online-docs-baseline.json');
// private-side scratch (outside run dirs, outside audit archive)
const TMP_HOMES = path.join(__dirname, 'tmp-homes', EXPERIMENT_ID);
const HOME_BASE = path.join(TMP_HOMES, '_base');
const TMP_GRADE = path.join(__dirname, 'tmp-grade', EXPERIMENT_ID);
// exposed-side run roots, namespaced per experiment
const RUNS = path.join(EXPOSED, 'runs', EXPERIMENT_ID);

// two frozen read-only trees: B arm carries bundled docs (real product form),
// A arm (and pointer-diagnostic arms except GB) runs on a tree without them
const TEMPLATE_B = path.join(EXPOSED, 'templates/demo-app');
const TEMPLATE_A = path.join(EXPOSED, 'templates/demo-app-prod-a');
const templateFor = arm =>
  arm === 'PROD-B' || arm === 'GB' ? TEMPLATE_B : TEMPLATE_A;
const VARIANTS = path.join(__dirname, 'production-variants');

const bankRaw = JSON.parse(
  fs.readFileSync(path.join(__dirname, BANK_FILE), 'utf-8'),
);
const tasks = (bankRaw.tasks ?? bankRaw).filter(t => !ONLY || t.id === ONLY);

// seeded RNG (mulberry32)
let s = SEED;
const rand = () => {
  s |= 0;
  s = (s + 0x6d2b79f5) | 0;
  let t = Math.imul(s ^ (s >>> 15), 1 | s);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const shuffled = a =>
  a
    .map(x => [rand(), x])
    .sort((p, q) => p[0] - q[0])
    .map(x => x[1]);

// waves: (task × rep) blocks in shuffled order; arms shuffled within wave
const waves = shuffled(
  tasks.flatMap(t =>
    Array.from({ length: REPS }, (_, i) => ({ task: t, rep: i + 1 })),
  ),
).map(w => ({ ...w, arms: shuffled([...ARMS]) }));

const runKey = (arm, taskId, rep) => `${arm}-${taskId}-r${rep}`;

// ---- clean HOME (private side, built once, copied per run) ------------------
function buildCleanHomeBase() {
  fs.rmSync(HOME_BASE, { recursive: true, force: true });
  fs.mkdirSync(path.join(HOME_BASE, '.claude'), { recursive: true });
  const realCreds = path.join(os.homedir(), '.claude/.credentials.json');
  if (fs.existsSync(realCreds)) {
    fs.copyFileSync(
      realCreds,
      path.join(HOME_BASE, '.claude/.credentials.json'),
    );
  }
  fs.writeFileSync(
    path.join(HOME_BASE, '.claude/settings.json'),
    JSON.stringify({ model: EXPECTED_MODEL }, null, 2),
  );
  // no CLAUDE.md, no skills/, no projects/ (memories), no .claude.json (MCP)
}

function makeRunHome(key) {
  const home = path.join(TMP_HOMES, key);
  fs.rmSync(home, { recursive: true, force: true });
  fs.cpSync(HOME_BASE, home, { recursive: true });
  return home;
}

function buildChildEnv(home) {
  const env = {};
  for (const k of CHILD_ENV_ALLOWLIST) {
    if (process.env[k] !== undefined) env[k] = process.env[k];
  }
  env.HOME = home;
  // pnpm v10+ verify-deps would purge/reinstall the shared symlinked
  // node_modules if the agent runs any pnpm script — hard-disable
  env.npm_config_verify_deps_before_run = 'false';
  return env;
}

// ---- run dir ----------------------------------------------------------------
function prepareRunDir(arm, task, rep) {
  const dir = path.join(RUNS, runKey(arm, task.id, rep));
  const template = templateFor(arm);
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
  for (const entry of fs.readdirSync(template)) {
    if (entry === 'node_modules') continue;
    fs.cpSync(path.join(template, entry), path.join(dir, entry), {
      recursive: true,
    });
  }
  fs.symlinkSync(
    path.join(template, 'node_modules'),
    path.join(dir, 'node_modules'),
  );
  fs.copyFileSync(
    path.join(VARIANTS, `${arm}.md`),
    path.join(dir, 'AGENTS.md'),
  );
  fs.writeFileSync(path.join(dir, 'CLAUDE.md'), '@AGENTS.md\n');
  execFileSync(
    'node',
    [path.join(__dirname, 'fixture.mjs'), 'verify-pre', dir],
    { stdio: 'pipe' },
  );
  return dir;
}

// ---- stream-json parsing (compliance counters + online-fetch evidence) ------
function contentBytes(content) {
  if (content == null) return 0;
  if (typeof content === 'string') return Buffer.byteLength(content);
  if (Array.isArray(content)) {
    let n = 0;
    for (const item of content) {
      if (item && typeof item.text === 'string')
        n += Buffer.byteLength(item.text);
      else n += Buffer.byteLength(JSON.stringify(item ?? ''));
    }
    return n;
  }
  return Buffer.byteLength(JSON.stringify(content));
}

function parseStream(out) {
  const rec = {
    model: '',
    duration_ms: 0,
    num_turns: 0,
    tool_calls: 0,
    read_calls: 0,
    webfetch_calls: 0,
    webfetch_errors: 0,
    local_docs_reads: 0,
    online_docs_fetches: 0,
    bash_online_fetches: 0,
    input_tokens: 0,
    output_tokens: 0,
    cost_usd: 0,
    is_error: false,
    final_text: '',
  };
  const fetches = []; // evidence: every WebFetch + every Bash curl/wget
  const idToName = new Map();
  const idToFetch = new Map();
  for (const line of out.split('\n')) {
    if (!line.trim()) continue;
    let j;
    try {
      j = JSON.parse(line);
    } catch {
      continue;
    }
    if (j.type === 'system' && j.subtype === 'init')
      rec.model = typeof j.model === 'string' ? j.model : '';
    if (j.type === 'assistant') {
      for (const c of j.message?.content ?? []) {
        if (c.type !== 'tool_use') continue;
        rec.tool_calls++;
        idToName.set(c.id, c.name);
        const input = c.input ?? {};
        if (c.name === 'Read') {
          rec.read_calls++;
          if (String(input.file_path ?? '').includes('main-doc/docs'))
            rec.local_docs_reads++;
        }
        if (c.name === 'WebFetch') {
          rec.webfetch_calls++;
          const url = String(input.url ?? '');
          if (url.includes('modernjs.dev')) rec.online_docs_fetches++;
          const f = { via: 'WebFetch', url, ok: null, bytes_estimate: null };
          fetches.push(f);
          idToFetch.set(c.id, f);
        }
        if (c.name === 'Bash') {
          const cmd = String(input.command ?? '');
          if (/\b(curl|wget)\b/.test(cmd)) {
            if (cmd.includes('modernjs.dev')) rec.bash_online_fetches++;
            const f = {
              via: 'Bash',
              command: cmd.slice(0, 4000),
              urls: cmd.match(/https?:\/\/[^\s"'<>\\)]+/g) ?? [],
              ok: null,
              bytes_estimate: null,
            };
            fetches.push(f);
            idToFetch.set(c.id, f);
          }
          if (cmd.includes('main-doc/docs')) rec.local_docs_reads++;
        }
        if (['Grep', 'Glob'].includes(c.name)) {
          if (JSON.stringify(input).includes('main-doc/docs'))
            rec.local_docs_reads++;
        }
      }
    }
    if (j.type === 'user') {
      for (const c of j.message?.content ?? []) {
        if (c.type !== 'tool_result') continue;
        const f = idToFetch.get(c.tool_use_id);
        if (f) {
          f.ok = !c.is_error;
          f.bytes_estimate = contentBytes(c.content);
        }
        if (c.is_error && idToName.get(c.tool_use_id) === 'WebFetch')
          rec.webfetch_errors++;
      }
    }
    if (j.type === 'result') {
      rec.duration_ms = j.duration_ms ?? rec.duration_ms;
      rec.num_turns = j.num_turns ?? 0;
      rec.cost_usd = j.total_cost_usd ?? 0;
      rec.input_tokens =
        (j.usage?.input_tokens ?? 0) +
        (j.usage?.cache_read_input_tokens ?? 0) +
        (j.usage?.cache_creation_input_tokens ?? 0);
      rec.output_tokens = j.usage?.output_tokens ?? 0;
      rec.is_error = j.is_error ?? rec.is_error;
      rec.final_text = typeof j.result === 'string' ? j.result : '';
    }
  }
  return { rec, fetches };
}

// ---- agent execution (isolation-hook aware) ----------------------------------
function claudeCommand(task) {
  const baseArgs = [
    '-p',
    task.prompt,
    '--output-format',
    'stream-json',
    '--verbose',
    '--max-turns',
    MAX_TURNS,
    '--dangerously-skip-permissions',
    '--model',
    EXPECTED_MODEL,
    '--allowedTools',
    ALLOWED_TOOLS,
  ];
  return ISOLATE_CMD
    ? { bin: ISOLATE_CMD, argv: [CLAUDE_BIN, ...baseArgs] }
    : { bin: CLAUDE_BIN, argv: baseArgs };
}

function runClaude(task, dir, home) {
  return new Promise(resolve => {
    const started = Date.now();
    const { bin, argv } = claudeCommand(task);
    const child = spawn(bin, argv, {
      cwd: dir,
      env: buildChildEnv(home),
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let out = '';
    let err = '';
    child.stdout.on('data', d => (out += d));
    child.stderr.on('data', d => (err += d));
    let killed = false;
    const killer = setTimeout(() => {
      killed = true;
      child.kill('SIGKILL');
    }, TIMEOUT_MS);
    child.on('close', code => {
      clearTimeout(killer);
      const wall_ms = Date.now() - started;
      const { rec, fetches } = parseStream(out);
      if (rec.duration_ms === 0) rec.duration_ms = wall_ms;
      rec.is_error = rec.is_error || code !== 0;
      rec.timeout = killed;
      if (err && rec.is_error) rec.stderr_tail = err.slice(-300);
      resolve({ rec, fetches, out, err, exit_code: code, wall_ms });
    });
  });
}

// ---- audit snapshot ----------------------------------------------------------
// Immediately after the agent exits: archive the workspace excluding the
// node_modules symlink and any .home (defense in depth — HOME lives outside the
// run dir in v3, so credentials can never be inside it anyway).
function snapshotWorkspace(runDir, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const e of fs.readdirSync(runDir, { withFileTypes: true })) {
    if (e.name === 'node_modules' || e.name === '.home') continue;
    fs.cpSync(path.join(runDir, e.name), path.join(dest, e.name), {
      recursive: true,
      verbatimSymlinks: true, // never dereference agent-created symlinks
    });
  }
  // hard credential guard: nothing credential-like may enter the audit archive
  const offenders = [];
  (function scan(d) {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const full = path.join(d, e.name);
      if (e.name === '.credentials.json' || e.name === '.home')
        offenders.push(full);
      if (e.isDirectory()) scan(full);
    }
  })(dest);
  if (offenders.length) {
    fs.rmSync(dest, { recursive: true, force: true });
    throw new Error(
      `credential-like entries in snapshot (purged): ${offenders.join(', ')}`,
    );
  }
}

// ---- grading (on a scratch copy of the snapshot, never the run dir) ----------
function gradeSnapshot(arm, taskId, snapshotDir, key) {
  const gdir = path.join(TMP_GRADE, key);
  fs.rmSync(gdir, { recursive: true, force: true });
  fs.mkdirSync(path.dirname(gdir), { recursive: true });
  fs.cpSync(snapshotDir, gdir, { recursive: true, verbatimSymlinks: true });
  // graders may need the shared install tree (build/serve checks)
  fs.symlinkSync(
    path.join(templateFor(arm), 'node_modules'),
    path.join(gdir, 'node_modules'),
  );
  try {
    return grade(BANK_FILE, taskId, gdir);
  } finally {
    fs.rmSync(gdir, { recursive: true, force: true });
  }
}

function grade(bankFile, taskId, dir) {
  try {
    const outp = execFileSync(
      'node',
      [
        path.join(__dirname, 'engine.mjs'),
        path.join(__dirname, bankFile),
        taskId,
        dir,
        '--json',
      ],
      { encoding: 'utf-8', timeout: 8 * 60 * 1000 },
    );
    return JSON.parse(outp.trim().split('\n').pop());
  } catch (e) {
    try {
      return JSON.parse((e.stdout || '').trim().split('\n').pop());
    } catch {
      return {
        pass: false,
        abstained: false,
        reason: `grader crashed: ${String(e.message).slice(0, 200)}`,
      };
    }
  }
}

// ---- online docs baseline ------------------------------------------------
function fetchDoc(url) {
  try {
    const buf = execFileSync(
      'curl',
      ['-sS', '--max-time', '60', '--fail', url],
      { maxBuffer: 128 * 1024 * 1024 },
    );
    return {
      url,
      ok: true,
      bytes: buf.length,
      sha256: crypto.createHash('sha256').update(buf).digest('hex'),
    };
  } catch (e) {
    return { url, ok: false, error: String(e.message).slice(0, 300) };
  }
}

function computeDrift(start, end) {
  // true  → confirmed content change between start and end
  // false → all urls fetched ok twice with identical sha256
  // 'unknown' → at least one url could not be compared (fetch failure)
  let drift = false;
  let unknown = false;
  for (const st of start) {
    const en = end.find(e => e.url === st.url);
    if (!st.ok || !en?.ok) unknown = true;
    else if (st.sha256 !== en.sha256) drift = true;
  }
  return drift ? true : unknown ? 'unknown' : false;
}

// ---- results manifest gate -------------------------------------------------
function checkResultsManifest() {
  const counts = new Map();
  for (const t of tasks)
    for (let r = 1; r <= REPS; r++)
      for (const a of ARMS) counts.set(`${a}×${t.id}×r${r}`, 0);
  const extra = [];
  let unparsed = 0;
  const lines = fs.existsSync(RESULTS_FILE)
    ? fs.readFileSync(RESULTS_FILE, 'utf-8').split('\n').filter(Boolean)
    : [];
  for (const line of lines) {
    let row;
    try {
      row = JSON.parse(line);
    } catch {
      unparsed++;
      continue;
    }
    const k = `${row.group}×${row.task}×r${row.rep}`;
    if (counts.has(k)) counts.set(k, counts.get(k) + 1);
    else extra.push(k);
  }
  const missing = [...counts.entries()].filter(([, n]) => n === 0).map(([k]) => k);
  const duplicates = [...counts.entries()]
    .filter(([, n]) => n > 1)
    .map(([k, n]) => `${k} (${n})`);
  const ok =
    missing.length === 0 &&
    duplicates.length === 0 &&
    extra.length === 0 &&
    unparsed === 0;
  return {
    expected_rows: counts.size,
    actual_rows: lines.length,
    unparsed_lines: unparsed,
    missing,
    duplicates,
    extra,
    ok,
  };
}

// ---- experiment metadata -----------------------------------------------------
function writeExpMeta(patch) {
  const cur = fs.existsSync(EXP_META)
    ? JSON.parse(fs.readFileSync(EXP_META, 'utf-8'))
    : {};
  fs.writeFileSync(EXP_META, JSON.stringify({ ...cur, ...patch }, null, 2));
}

function finalize({ aborted, baselineStart }) {
  const baselineEnd = BASELINE_URLS.map(fetchDoc);
  const drift = computeDrift(baselineStart, baselineEnd);
  fs.writeFileSync(
    BASELINE_FILE,
    JSON.stringify(
      { start: baselineStart, end: baselineEnd, drift },
      null,
      2,
    ),
  );
  const manifestCheck = checkResultsManifest();
  if (aborted) manifestCheck.aborted = aborted;
  fs.writeFileSync(
    path.join(EXP_DIR, 'manifest-check.json'),
    JSON.stringify(manifestCheck, null, 2),
  );
  writeExpMeta({
    ended_at: new Date().toISOString(),
    drift,
    aborted: aborted ?? null,
    manifest_ok: manifestCheck.ok,
  });
  // scrub private temp (credentials copies) + exposed run root
  fs.rmSync(TMP_HOMES, { recursive: true, force: true });
  fs.rmSync(TMP_GRADE, { recursive: true, force: true });
  fs.rmSync(RUNS, { recursive: true, force: true });
  console.log(
    `manifest-check: ${manifestCheck.ok ? 'OK' : 'BAD'} (${manifestCheck.actual_rows}/${manifestCheck.expected_rows} rows` +
      `${manifestCheck.missing.length ? `, missing ${manifestCheck.missing.length}` : ''}` +
      `${manifestCheck.duplicates.length ? `, dup ${manifestCheck.duplicates.length}` : ''}` +
      `${manifestCheck.extra.length ? `, extra ${manifestCheck.extra.length}` : ''})` +
      ` | online-docs drift=${drift}`,
  );
  return manifestCheck;
}

// ---- main ---------------------------------------------------------------------
async function main() {
  let cliVersion = 'unknown';
  try {
    cliVersion = execFileSync(CLAUDE_BIN, ['--version'], {
      encoding: 'utf-8',
    }).trim();
  } catch {}
  console.log(
    `experiment: ${EXPERIMENT_ID}\nprotocol: model=${EXPECTED_MODEL} cli=${cliVersion} seed=${SEED} allowedTools=${ALLOWED_TOOLS}`,
  );
  console.log(
    `waves=${waves.length} arms=${ARMS.join(',')} reps=${REPS} → runs=${waves.length * ARMS.length}` +
      `${ISOLATE_CMD ? ` isolate=${ISOLATE_CMD}` : ''}`,
  );

  if (DRY) {
    // strictly zero side effects: nothing created, nothing copied, no network
    console.log(`DRY RUN — plan only. Would write to: ${EXP_DIR}`);
    if (fs.existsSync(EXP_DIR))
      console.log(`note: ${EXP_DIR} already exists — a real start would be REFUSED`);
    console.log(`run dirs (exposed): ${RUNS}/<arm>-<task>-r<rep>`);
    console.log(`per-run HOME (private): ${TMP_HOMES}/<arm>-<task>-r<rep>`);
    for (const w of waves)
      console.log(`wave ${w.task.id} r${w.rep}: ${w.arms.join(' → ')}`);
    return;
  }

  // experiment uniqueness / result immutability gate
  fs.mkdirSync(path.dirname(EXP_DIR), { recursive: true });
  try {
    fs.mkdirSync(EXP_DIR);
  } catch (e) {
    if (e.code === 'EEXIST') {
      console.error(
        `REFUSED: results dir already exists (${EXP_DIR}). ` +
          'Results are immutable — start a new experiment instead.',
      );
      process.exit(2);
    }
    throw e;
  }
  fs.mkdirSync(AUDIT_DIR, { recursive: true });
  fs.mkdirSync(RUNS, { recursive: true });
  buildCleanHomeBase();

  const baselineStart = BASELINE_URLS.map(fetchDoc);
  fs.writeFileSync(
    BASELINE_FILE,
    JSON.stringify({ start: baselineStart }, null, 2),
  );

  writeExpMeta({
    experiment_id: EXPERIMENT_ID,
    ab_commit: AB_COMMIT,
    bank: BANK_FILE,
    arms: ARMS,
    reps: REPS,
    only: ONLY || null,
    seed: SEED,
    model_pin: EXPECTED_MODEL,
    allowed_tools: ALLOWED_TOOLS,
    child_env_allowlist: CHILD_ENV_ALLOWLIST,
    max_turns: Number(MAX_TURNS),
    timeout_ms: TIMEOUT_MS,
    cli_version: cliVersion,
    claude_bin: CLAUDE_BIN,
    isolate_cmd: ISOLATE_CMD || null,
    exposed_root: EXPOSED,
    planned_runs: waves.length * ARMS.length,
    waves: waves.map((w, i) => ({
      wave: i,
      task: w.task.id,
      rep: w.rep,
      arms: w.arms,
    })),
    started_at: new Date().toISOString(),
  });

  let done = 0;
  const total = waves.length * ARMS.length;
  for (const [wi, wave] of waves.entries()) {
    // all arms of a wave run concurrently (adjacent in time)
    const results = await Promise.all(
      wave.arms.map(async arm => {
        const key = runKey(arm, wave.task.id, wave.rep);
        const dir = prepareRunDir(arm, wave.task, wave.rep);
        const home = makeRunHome(key);
        const started_at = new Date().toISOString();
        const r = await runClaude(wave.task, dir, home);
        // persist final answer for QA grading — inside the workspace, so it
        // travels with the snapshot the grader will see
        fs.writeFileSync(
          path.join(dir, '.final-answer.txt'),
          r.rec.final_text ?? '',
        );
        // audit archive, immediately after agent exit
        const adir = path.join(AUDIT_DIR, key);
        fs.mkdirSync(adir, { recursive: true });
        fs.writeFileSync(path.join(adir, 'stream.jsonl'), r.out);
        fs.writeFileSync(path.join(adir, 'stderr.log'), r.err);
        fs.writeFileSync(
          path.join(adir, 'online-fetches.json'),
          JSON.stringify(r.fetches, null, 2),
        );
        fs.writeFileSync(
          path.join(adir, 'run-meta.json'),
          JSON.stringify(
            {
              key,
              arm,
              task: wave.task.id,
              rep: wave.rep,
              wave: wi,
              started_at,
              exit_code: r.exit_code,
              wall_ms: r.wall_ms,
              timeout: r.rec.timeout,
              model_seen: r.rec.model,
              claude_bin: CLAUDE_BIN,
              isolate_cmd: ISOLATE_CMD || null,
            },
            null,
            2,
          ),
        );
        const snapDir = path.join(adir, 'workspace');
        snapshotWorkspace(dir, snapDir);
        // snapshot taken → original run dir + per-run HOME are disposable
        fs.rmSync(dir, { recursive: true, force: true });
        fs.rmSync(home, { recursive: true, force: true });
        return { arm, key, snapDir, started_at, rec: r.rec, fetches: r.fetches, exit_code: r.exit_code };
      }),
    );
    // model pin gate: EVERY run must report exactly the pinned model from its
    // stream-json init — a missing/empty model field is a violation too
    const violators = results.filter(r => r.rec.model !== EXPECTED_MODEL);
    if (violators.length) {
      console.error(
        `WAVE ${wave.task.id} r${wave.rep}: MODEL PIN VIOLATION ` +
          `[${results.map(r => `${r.arm}=${r.rec.model || '(missing)'}`).join(', ')}] — aborting experiment`,
      );
      for (const r of results) {
        fs.appendFileSync(
          RESULTS_FILE,
          `${JSON.stringify({
            group: r.arm,
            task: wave.task.id,
            layer: wave.task.layer,
            rep: wave.rep,
            wave: wi,
            aborted: 'model-pin-violation',
            audit: `audit/${r.key}`,
            ...r.rec,
            final_text: undefined,
          })}\n`,
        );
      }
      finalize({ aborted: 'model-pin-violation', baselineStart });
      process.exit(3);
    }
    // grade after agent exit — on a scratch copy of the audit snapshot
    for (const r of results) {
      const verdict = gradeSnapshot(r.arm, wave.task.id, r.snapDir, r.key);
      const row = {
        experiment_id: EXPERIMENT_ID,
        group: r.arm,
        task: wave.task.id,
        layer: wave.task.layer,
        rep: wave.rep,
        pass: !!verdict.pass,
        abstained: !!verdict.abstained,
        reason: verdict.reason ?? '',
        started_at: r.started_at,
        wave: wi,
        exit_code: r.exit_code,
        audit: `audit/${r.key}`,
        online_fetch_events: r.fetches.length,
        online_fetch_failures: r.fetches.filter(f => f.ok === false).length,
        ...r.rec,
      };
      row.final_text = undefined;
      fs.appendFileSync(RESULTS_FILE, `${JSON.stringify(row)}\n`);
      done++;
      console.log(
        `[${done}/${total}] w${wi} ${r.arm} ${wave.task.id} r${wave.rep} → ${row.pass ? 'PASS' : 'FAIL'} (${Math.round(row.duration_ms / 1000)}s${row.pass ? '' : ` | ${row.reason}`})`,
      );
    }
    // shared-docs pollution check per wave
    try {
      execFileSync(
        'node',
        [path.join(__dirname, 'fixture.mjs'), 'verify-shared'],
        { stdio: 'pipe' },
      );
    } catch {
      console.error(`WAVE ${wi}: SHARED DOCS MUTATED — aborting`);
      finalize({ aborted: 'shared-docs-mutated', baselineStart });
      process.exit(4);
    }
  }
  const check = finalize({ baselineStart });
  console.log('ALL DONE →', RESULTS_FILE);
  if (!check.ok) process.exit(5);
}

main();
