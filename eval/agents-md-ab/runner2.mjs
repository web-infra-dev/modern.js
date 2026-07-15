// A/B experiment runner v2 — pre-registered execution protocol.
// Usage: node runner2.mjs --bank pilot-bank.json --arms PROD-A,PROD-B --reps 2 [--only T03] [--dry]
//
// Frozen protocol (changes require re-review):
//   - permission mode: --dangerously-skip-permissions (isolated throwaway dirs)
//   - max-turns 30, hard timeout 10min/run
//   - clean HOME per run: only auth credentials copied in; no user CLAUDE.md,
//     no memories, no MCP servers, no skills, no hooks
//   - model pin: EXPECTED_MODEL verified from stream-json init; a wave aborts
//     if any run in it reports a different underlying model id
//   - wave blocking: wave = (task × rep); all arms run inside the same wave,
//     arm order shuffled per wave (seeded), workers = arms in parallel
//   - compliance (ITT): every run logs local-docs reads / online fetches
//     (WebFetch AND Bash curl/wget) — non-compliant runs are kept, flagged
//   - fixture: verify-pre before each run; shared-docs check after each wave
//   - grader mounted only AFTER the agent process exits (engine.mjs lives
//     outside the run tree)
import { execFileSync, execSync, spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CLAUDE_BIN =
  process.env.CLAUDE_BIN ?? path.join(os.homedir(), '.npm-global/bin/claude');
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

// two frozen read-only trees: B arm carries bundled docs (real product form),
// A arm (and pointer-diagnostic arms except GB) runs on a tree without them
const TEMPLATE_B = path.join(__dirname, 'template/demo-app');
const TEMPLATE_A = path.join(__dirname, 'template/demo-app-prod-a');
const templateFor = arm =>
  arm === 'PROD-B' || arm === 'GB' ? TEMPLATE_B : TEMPLATE_A;
const RUNS = path.join(__dirname, 'runs2');
const RESULTS = path.join(
  __dirname,
  `results-${path.basename(BANK_FILE, '.json')}.jsonl`,
);
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

// ---- clean HOME (built once, copied per run) --------------------------------
const CLEAN_HOME_BASE = path.join(__dirname, 'home-clean');
function buildCleanHomeBase() {
  fs.rmSync(CLEAN_HOME_BASE, { recursive: true, force: true });
  fs.mkdirSync(path.join(CLEAN_HOME_BASE, '.claude'), { recursive: true });
  const realCreds = path.join(os.homedir(), '.claude/.credentials.json');
  if (fs.existsSync(realCreds)) {
    fs.copyFileSync(
      realCreds,
      path.join(CLEAN_HOME_BASE, '.claude/.credentials.json'),
    );
  }
  fs.writeFileSync(
    path.join(CLEAN_HOME_BASE, '.claude/settings.json'),
    JSON.stringify({ model: EXPECTED_MODEL }, null, 2),
  );
  // no CLAUDE.md, no skills/, no projects/ (memories), no .claude.json (MCP)
}

function prepareRunDir(arm, task, rep) {
  const dir = path.join(RUNS, `${arm}-${task.id}-r${rep}`);
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
  // per-run HOME copy (claude may write state under it)
  const home = path.join(dir, '.home');
  fs.cpSync(CLEAN_HOME_BASE, home, { recursive: true });
  execFileSync(
    'node',
    [path.join(__dirname, 'fixture.mjs'), 'verify-pre', dir],
    {
      stdio: 'pipe',
    },
  );
  return dir;
}

function runClaude(task, dir) {
  return new Promise(resolve => {
    const started = Date.now();
    const child = spawn(
      CLAUDE_BIN,
      [
        '-p',
        task.prompt,
        '--output-format',
        'stream-json',
        '--verbose',
        '--max-turns',
        MAX_TURNS,
        '--dangerously-skip-permissions',
      ],
      {
        cwd: dir,
        env: {
          ...process.env,
          HOME: path.join(dir, '.home'),
          CLAUDECODE: '',
          // pnpm v10+ verify-deps would purge/reinstall the shared symlinked
          // node_modules if the agent runs any pnpm script — hard-disable
          npm_config_verify_deps_before_run: 'false',
          XDG_CONFIG_HOME: '',
        },
        stdio: ['ignore', 'pipe', 'pipe'],
      },
    );
    let out = '';
    let err = '';
    child.stdout.on('data', d => (out += d));
    child.stderr.on('data', d => (err += d));
    const killer = setTimeout(() => child.kill('SIGKILL'), TIMEOUT_MS);
    child.on('close', code => {
      clearTimeout(killer);
      const rec = {
        model: '',
        duration_ms: Date.now() - started,
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
        is_error: code !== 0,
        timeout: Date.now() - started >= TIMEOUT_MS,
        final_text: '',
      };
      const idToName = new Map();
      for (const line of out.split('\n')) {
        if (!line.trim()) continue;
        let j;
        try {
          j = JSON.parse(line);
        } catch {
          continue;
        }
        if (j.type === 'system' && j.subtype === 'init')
          rec.model = j.model ?? '';
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
              if (String(input.url ?? '').includes('modernjs.dev'))
                rec.online_docs_fetches++;
            }
            if (c.name === 'Bash') {
              const cmd = String(input.command ?? '');
              if (/\b(curl|wget)\b/.test(cmd) && cmd.includes('modernjs.dev')) {
                rec.bash_online_fetches++;
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
            if (
              c.type === 'tool_result' &&
              c.is_error &&
              idToName.get(c.tool_use_id) === 'WebFetch'
            )
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
      if (err && rec.is_error) rec.stderr_tail = err.slice(-300);
      resolve(rec);
    });
  });
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

async function main() {
  buildCleanHomeBase();
  fs.mkdirSync(RUNS, { recursive: true });
  const cliVersion = execSync(`${CLAUDE_BIN} --version`, {
    encoding: 'utf-8',
  }).trim();
  console.log(
    `protocol: model=${EXPECTED_MODEL} cli=${cliVersion} seed=${SEED}`,
  );
  console.log(
    `waves=${waves.length} arms=${ARMS.join(',')} reps=${REPS} → runs=${waves.length * ARMS.length}`,
  );
  if (DRY) {
    for (const w of waves)
      console.log(`wave ${w.task.id} r${w.rep}: ${w.arms.join(' → ')}`);
    return;
  }

  let done = 0;
  const total = waves.length * ARMS.length;
  for (const [wi, wave] of waves.entries()) {
    // all arms of a wave run concurrently (adjacent in time)
    const results = await Promise.all(
      wave.arms.map(async arm => {
        const dir = prepareRunDir(arm, wave.task, wave.rep);
        const started_at = new Date().toISOString();
        const rec = await runClaude(wave.task, dir);
        // persist final answer for QA grading before grader mounts
        fs.writeFileSync(
          path.join(dir, '.final-answer.txt'),
          rec.final_text ?? '',
        );
        return { arm, dir, started_at, rec };
      }),
    );
    // model pin gate: abort wave (and stop) if any run drifted
    const models = results.map(r => r.rec.model).filter(Boolean);
    if (models.some(m => m !== EXPECTED_MODEL)) {
      console.error(
        `WAVE ${wave.task.id} r${wave.rep}: MODEL DRIFT ${models} — aborting experiment`,
      );
      for (const r of results) {
        fs.appendFileSync(
          RESULTS,
          `${JSON.stringify({
            group: r.arm,
            task: wave.task.id,
            layer: wave.task.layer,
            rep: wave.rep,
            aborted: 'model-drift',
            ...r.rec,
            final_text: undefined,
          })}\n`,
        );
      }
      process.exit(3);
    }
    // grade after agent exit
    for (const r of results) {
      const verdict = grade(BANK_FILE, wave.task.id, r.dir);
      const row = {
        group: r.arm,
        task: wave.task.id,
        layer: wave.task.layer,
        rep: wave.rep,
        pass: !!verdict.pass,
        abstained: !!verdict.abstained,
        reason: verdict.reason ?? '',
        started_at: r.started_at,
        wave: wi,
        ...r.rec,
      };
      row.final_text = undefined;
      fs.appendFileSync(RESULTS, `${JSON.stringify(row)}\n`);
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
      process.exit(4);
    }
  }
  console.log('ALL DONE →', RESULTS);
}

main();
