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
    // A freshly scaffolded project pins the current version, which ships the
    // docs — so the block names the bundled path, not an online index.
    expect(content).toContain('node_modules/@modern-js/app-tools/docs/');
    expect(content).not.toContain('https://modernjs.dev');

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

describe('--agents-md-only (existing projects)', () => {
  const BEGIN = '<!-- BEGIN:modernjs-agent-rules -->';
  const END = '<!-- END:modernjs-agent-rules -->';
  const read = (name: string) =>
    fs.readFileSync(path.join(workdir, name), 'utf-8');

  // The command only writes into projects that actually use Modern.js.
  beforeEach(() => {
    fs.writeFileSync(
      path.join(workdir, 'package.json'),
      JSON.stringify({
        name: 'fixture',
        devDependencies: { '@modern-js/app-tools': '3.8.0' },
      }),
    );
  });

  it('errors when combined with a project name', () => {
    expect(() => runCreate(['--agents-md-only', 'my-app'])).toThrow();
    expect(fs.existsSync(path.join(workdir, 'my-app'))).toBe(false);
    expect(fs.existsSync(path.join(workdir, 'AGENTS.md'))).toBe(false);
  });

  it('errors when combined with --no-agents-md', () => {
    expect(() => runCreate(['--agents-md-only', '--no-agents-md'])).toThrow();
  });

  it('no longer reserves "agents-md" as a project name', () => {
    runCreate(['agents-md']);
    expect(fs.existsSync(path.join(workdir, 'agents-md/package.json'))).toBe(
      true,
    );
  });

  it('creates AGENTS.md and CLAUDE.md when neither exists', () => {
    runCreate(['--agents-md-only']);

    const agents = read('AGENTS.md');
    expect(agents).toContain(BEGIN);
    expect(agents).toContain(END);
    expect(agents).toContain('node_modules/@modern-js/app-tools/docs/');
    expect(read('CLAUDE.md').trim()).toBe('@AGENTS.md');
  });

  it('refreshes the managed block in place and keeps user content', () => {
    fs.writeFileSync(
      path.join(workdir, 'AGENTS.md'),
      `${BEGIN}\nOLD: node_modules/@modern-js/app-tools/main-doc/docs/en/\n${END}\n\n# My custom rules\nkeep me\n`,
    );
    runCreate(['--agents-md-only']);

    const agents = read('AGENTS.md');
    // stale path replaced with the current one, user content preserved
    expect(agents).not.toContain('main-doc/docs/en');
    expect(agents).toContain('node_modules/@modern-js/app-tools/docs/');
    expect(agents).toContain('# My custom rules');
    expect(agents).toContain('keep me');
  });

  it('prepends the managed block above existing content when AGENTS.md has no markers', () => {
    fs.writeFileSync(path.join(workdir, 'AGENTS.md'), '# My rules\ndo X\n');
    runCreate(['--agents-md-only']);

    const agents = read('AGENTS.md');
    expect(agents).toContain('do X');
    expect(agents).toContain('node_modules/@modern-js/app-tools/docs/');
    // managed block leads the file, user content stays below it
    expect(agents.startsWith(BEGIN)).toBe(true);
    expect(agents.indexOf(BEGIN)).toBeLessThan(agents.indexOf('# My rules'));
  });

  it('adds the @AGENTS.md import to an existing CLAUDE.md', () => {
    fs.writeFileSync(
      path.join(workdir, 'CLAUDE.md'),
      '# existing claude config\nsome rule\n',
    );
    runCreate(['--agents-md-only']);

    const claude = read('CLAUDE.md');
    expect(claude.split('\n').some(l => l.trim() === '@AGENTS.md')).toBe(true);
    expect(claude).toContain('some rule');
  });

  it('is idempotent on a second run', () => {
    runCreate(['--agents-md-only']);
    const first = read('AGENTS.md') + read('CLAUDE.md');
    runCreate(['--agents-md-only']);
    const second = read('AGENTS.md') + read('CLAUDE.md');
    expect(second).toBe(first);
  });
});

// Which docs a project should read follows from the version it installed, and
// that is decided when the file is written — AGENTS.md is read on every turn,
// so it must state one address rather than a rule for the agent to resolve.
describe('docs location by version', () => {
  const writePkg = (version: string) =>
    fs.writeFileSync(
      path.join(workdir, 'package.json'),
      JSON.stringify({
        name: 'fixture',
        devDependencies: { '@modern-js/app-tools': version },
      }),
    );

  // Versions without bundled docs get nothing written — only a hint — so no
  // file in the project can name docs that are not there.
  const unsupported = ['1.21.0', '2.68.0', '3.7.0'];
  for (const version of unsupported) {
    it(`${version} writes nothing and prints the hint`, () => {
      writePkg(version);
      const output = runCreate(['--agents-md-only']);

      expect(fs.existsSync(path.join(workdir, 'AGENTS.md'))).toBe(false);
      expect(fs.existsSync(path.join(workdir, 'CLAUDE.md'))).toBe(false);
      expect(output).toContain('3.8.0');
      expect(output).toContain('llms.txt');
    });
  }

  const supported = [
    '3.8.0',
    '^3.9.0',
    '0.0.0-canary-20260731095506',
    'workspace:*',
  ];
  for (const version of supported) {
    it(`${version} writes the bundled block`, () => {
      writePkg(version);
      runCreate(['--agents-md-only']);

      expect(
        fs.readFileSync(path.join(workdir, 'AGENTS.md'), 'utf-8'),
      ).toContain('node_modules/@modern-js/app-tools/docs/');
    });
  }

  it('prefers the installed version over the declared range', () => {
    // A range says what was asked for; node_modules says what was resolved.
    writePkg('^3.0.0');
    const installed = path.join(workdir, 'node_modules/@modern-js/app-tools');
    fs.mkdirSync(installed, { recursive: true });
    fs.writeFileSync(
      path.join(installed, 'package.json'),
      JSON.stringify({ name: '@modern-js/app-tools', version: '3.7.0' }),
    );
    const output = runCreate(['--agents-md-only']);

    expect(fs.existsSync(path.join(workdir, 'AGENTS.md'))).toBe(false);
    expect(output).toContain('3.8.0');
  });

  it('refuses a directory that does not use Modern.js', () => {
    fs.writeFileSync(
      path.join(workdir, 'package.json'),
      JSON.stringify({ name: 'unrelated', dependencies: { react: '19' } }),
    );

    expect(() => runCreate(['--agents-md-only'])).toThrow();
    expect(fs.existsSync(path.join(workdir, 'AGENTS.md'))).toBe(false);
  });

  it('keeps the scaffolding template in step with the generated block', () => {
    // New projects copy the template; existing ones get a generated block.
    // They must say the same thing, or the two paths drift apart.
    writePkg('3.8.0');
    runCreate(['--agents-md-only']);

    // Compared by content, not bytes: without a .gitattributes rule the
    // template checks out with CRLF on Windows, while the generated block is
    // always joined with \n.
    const readNormalized = (file: string) =>
      fs.readFileSync(file, 'utf-8').replace(/\r\n/g, '\n').trim();

    expect(readNormalized(path.join(workdir, 'AGENTS.md'))).toBe(
      readNormalized(path.resolve(__dirname, '../template/AGENTS.md')),
    );
  });
});
