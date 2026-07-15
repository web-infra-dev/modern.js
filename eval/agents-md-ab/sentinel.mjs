// Sentinel precheck (1 paid probe run per arm, executed at pilot start,
// transcripts archived): verifies that in the clean-HOME environment the ONLY
// instruction files in context are the run dir's CLAUDE.md -> AGENTS.md —
// no user-level CLAUDE.md, no memories, no skills, no MCP.
// Usage: node sentinel.mjs PROD-B
import { execFileSync, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const EXPOSED = process.env.AB_EXPOSED_ROOT ?? '/tmp/modernjs-ab-exposed';
const CLAUDE_BIN =
  process.env.CLAUDE_BIN ?? path.join(os.homedir(), '.npm-global/bin/claude');
const arm = process.argv[2] ?? 'PROD-B';
const dir = path.join(EXPOSED, 'runs', `sentinel-${arm}`);

// reuse runner2's prep by shelling a minimal copy here
fs.rmSync(dir, { recursive: true, force: true });
fs.mkdirSync(dir, { recursive: true });
const TEMPLATE = path.join(EXPOSED, 'templates/demo-app');
for (const entry of fs.readdirSync(TEMPLATE)) {
  if (entry === 'node_modules') continue;
  fs.cpSync(path.join(TEMPLATE, entry), path.join(dir, entry), {
    recursive: true,
  });
}
fs.symlinkSync(
  path.join(TEMPLATE, 'node_modules'),
  path.join(dir, 'node_modules'),
);
fs.copyFileSync(
  path.join(__dirname, 'production-variants', `${arm}.md`),
  path.join(dir, 'AGENTS.md'),
);
fs.writeFileSync(path.join(dir, 'CLAUDE.md'), '@AGENTS.md\n');
const home = path.join(dir, '.home');
fs.cpSync(path.join(__dirname, 'home-clean'), home, { recursive: true });

const PROMPT =
  'Do not use any tools. List the exact origins of every instruction/context document currently loaded into your context (user-level CLAUDE.md, project CLAUDE.md/AGENTS.md, memory files, skills, MCP servers). Output one item per line, nothing else.';

const res = spawnSync(
  CLAUDE_BIN,
  [
    '-p',
    PROMPT,
    '--output-format',
    'json',
    '--max-turns',
    '2',
    '--dangerously-skip-permissions',
  ],
  {
    cwd: dir,
    env: { ...process.env, HOME: home, CLAUDECODE: '' },
    encoding: 'utf-8',
    timeout: 120000,
  },
);
const out = JSON.parse(res.stdout);
const text = String(out.result ?? '');
fs.writeFileSync(path.join(dir, 'sentinel-transcript.txt'), text);

const mustContain = ['AGENTS.md'];
const mustNotContain = ['MEMORY.md', 'memory/', 'skills', 'mcp', 'MCP server:'];
const okPos = mustContain.every(k => text.includes(k));
const negHits = mustNotContain.filter(k =>
  text.toLowerCase().includes(k.toLowerCase()),
);
console.log(`--- sentinel output ---\n${text}\n-----------------------`);
console.log('model:', out.model ?? '(n/a)', 'cost:', out.total_cost_usd);
if (okPos && negHits.length === 0) {
  console.log('SENTINEL OK — only run-dir instructions in context');
  process.exit(0);
}
console.error(`SENTINEL FAIL — pos=${okPos} negHits=${negHits.join(',')}`);
process.exit(1);
