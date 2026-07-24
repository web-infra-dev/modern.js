import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const bin = path.resolve(__dirname, '../bin/run.js');

let workdir: string;

const runCreate = (args: string[]) =>
  execFileSync(process.execPath, [bin, ...args], {
    cwd: workdir,
    encoding: 'utf-8',
    env: { ...process.env, LANG: 'en_US.UTF-8' },
  });

beforeEach(() => {
  workdir = fs.mkdtempSync(path.join(os.tmpdir(), 'modern-create-test-'));
});

afterEach(() => {
  fs.rmSync(workdir, { recursive: true, force: true });
});

describe('agent files generation', () => {
  it('generates AGENTS.md and CLAUDE.md by default, with a hint', () => {
    const output = runCreate(['my-app']);

    const agents = path.join(workdir, 'my-app/AGENTS.md');
    const claude = path.join(workdir, 'my-app/CLAUDE.md');
    expect(fs.existsSync(agents)).toBe(true);
    expect(fs.existsSync(claude)).toBe(true);

    const content = fs.readFileSync(agents, 'utf-8');
    expect(content).toContain('<!-- BEGIN:modernjs-agent-rules -->');
    expect(content).toContain('<!-- END:modernjs-agent-rules -->');
    expect(content).toContain('node_modules/@modern-js/app-tools/docs/');
    expect(content).toContain('https://modernjs.dev/llms.txt');

    expect(fs.readFileSync(claude, 'utf-8').trim()).toBe('@AGENTS.md');
    expect(output).toContain('AGENTS.md & CLAUDE.md generated');
  });

  it('skips agent files with --no-agents-md and omits the hint', () => {
    const output = runCreate(['--no-agents-md', 'my-app']);

    expect(fs.existsSync(path.join(workdir, 'my-app/package.json'))).toBe(true);
    expect(fs.existsSync(path.join(workdir, 'my-app/AGENTS.md'))).toBe(false);
    expect(fs.existsSync(path.join(workdir, 'my-app/CLAUDE.md'))).toBe(false);
    expect(output).not.toContain('AGENTS.md & CLAUDE.md generated');
  });

  it('accepts --no-agents-md after the project name', () => {
    runCreate(['my-app', '--no-agents-md']);

    expect(fs.existsSync(path.join(workdir, 'my-app/package.json'))).toBe(true);
    expect(fs.existsSync(path.join(workdir, 'my-app/AGENTS.md'))).toBe(false);
  });

  it('skips agent files in subproject mode and omits the hint', () => {
    const output = runCreate(['--sub', 'my-app']);

    expect(fs.existsSync(path.join(workdir, 'my-app/package.json'))).toBe(true);
    expect(fs.existsSync(path.join(workdir, 'my-app/AGENTS.md'))).toBe(false);
    expect(output).not.toContain('AGENTS.md & CLAUDE.md generated');
  });
});

describe('positional argument parsing', () => {
  it('does not swallow the project name after a boolean flag', () => {
    // regression: boolean flags used to be treated like value-consuming
    // flags, so `create --sub my-app` ignored `my-app`
    runCreate(['--sub', 'my-app']);

    const pkg = JSON.parse(
      fs.readFileSync(path.join(workdir, 'my-app/package.json'), 'utf-8'),
    );
    expect(pkg.name).toBe('my-app');
  });

  it('still treats the value of --lang as a flag value, not a name', () => {
    runCreate(['--lang', 'zh', 'my-app']);

    expect(fs.existsSync(path.join(workdir, 'my-app/package.json'))).toBe(true);
    expect(fs.existsSync(path.join(workdir, 'zh'))).toBe(false);
  });
});
