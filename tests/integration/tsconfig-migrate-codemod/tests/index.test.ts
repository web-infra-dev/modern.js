import { execFileSync, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

// Acceptance for the tsconfig codemod in the `modernjs-migrate-to-v3` skill:
// take a project created from the pre-bundler-baseline template
// (`"baseUrl": "./"` + `extends @modern-js/tsconfig/base`, BFF, CommonJS),
// run `migrate-tsconfig.mjs`, then check the result with TypeScript 6.0.3
// against the `@modern-js/tsconfig` of this workspace.

rstest.setConfig({ testTimeout: 1000 * 60 * 3, hookTimeout: 1000 * 60 * 3 });

const TS_VERSION = '6.0.3';
const repoRoot = path.resolve(__dirname, '../../../..');
const fixture = path.join(
  repoRoot,
  'tests/skill/fixtures/v3-legacy-tsconfig-bff',
);
const codemod = path.join(
  repoRoot,
  'skills/modernjs-migrate-to-v3/scripts/migrate-tsconfig.mjs',
);
// Inside the repo so `@modern-js/tsconfig` resolves to the workspace package.
const appDir = path.resolve(__dirname, '../.tmp/app');

let tsPrefix: string;
let ts: typeof import('typescript');
let tscBin: string;

const tsc = (args: string[]) =>
  spawnSync(process.execPath, [tscBin, ...args], {
    cwd: appDir,
    encoding: 'utf8',
  });

const configErrors = (configFile: string) => {
  const parsed = ts.getParsedCommandLineOfConfigFile(
    path.join(appDir, configFile),
    {},
    {
      ...ts.sys,
      onUnRecoverableConfigFileDiagnostic: () => {},
    },
  );
  if (!parsed) {
    throw new Error(`failed to read ${configFile}`);
  }
  const program = ts.createProgram({
    rootNames: parsed.fileNames,
    options: parsed.options,
    configFileParsingDiagnostics: parsed.errors,
  });
  const diagnostics = [
    ...parsed.errors,
    ...program.getConfigFileParsingDiagnostics(),
    ...program.getOptionsDiagnostics(),
  ];
  return {
    parsed,
    codes: diagnostics.map(d => d.code),
    messages: diagnostics.map(d =>
      ts.flattenDiagnosticMessageText(d.messageText, '\n'),
    ),
  };
};

beforeAll(() => {
  // TypeScript 6 is not a workspace dependency (adding it would move every
  // `typescript` peer in the lockfile), so install it into a scratch prefix.
  tsPrefix = fs.mkdtempSync(path.join(os.tmpdir(), 'modern-ts6-'));
  fs.writeFileSync(
    path.join(tsPrefix, 'package.json'),
    JSON.stringify({ private: true }),
  );
  execFileSync(
    'npm',
    [
      'install',
      `typescript@${TS_VERSION}`,
      '--no-save',
      '--no-package-lock',
      '--no-audit',
      '--no-fund',
      '--ignore-scripts',
    ],
    { cwd: tsPrefix, stdio: 'pipe', shell: process.platform === 'win32' },
  );
  const tsDir = path.join(tsPrefix, 'node_modules/typescript');
  ts = require(tsDir);
  tscBin = path.join(tsDir, 'bin/tsc');

  fs.rmSync(appDir, { recursive: true, force: true });
  fs.cpSync(fixture, appDir, { recursive: true });
  // modern.config.ts imports framework packages that are not installed in
  // this scratch project; it is not what this test is about.
  fs.rmSync(path.join(appDir, 'modern.config.ts'));
  fs.rmSync(path.join(appDir, 'PROVENANCE.md'));
});

afterAll(() => {
  fs.rmSync(path.resolve(__dirname, '../.tmp'), {
    recursive: true,
    force: true,
  });
  if (tsPrefix) {
    fs.rmSync(tsPrefix, { recursive: true, force: true });
  }
});

// `tests/skill/*.mjs` are plain Node scripts outside rstest; run the tsconfig
// one here so its behavior matrix (custom baseUrl, JSONC, ESM, idempotency,
// migrate.mjs flow) is covered by CI too.
test('skill script checks for migrate-tsconfig pass', () => {
  const result = spawnSync(
    process.execPath,
    [path.join(repoRoot, 'tests/skill/migrate-tsconfig.mjs')],
    { encoding: 'utf8' },
  );
  expect(result.stderr).toBe('');
  expect(result.stdout).toContain('0 失败');
  expect(result.status).toBe(0);
});

describe('tsconfig codemod on the legacy create template', () => {
  test('uses TypeScript 6.0.3 and the workspace @modern-js/tsconfig', () => {
    expect(ts.version).toBe(TS_VERSION);
    const base = require.resolve('@modern-js/tsconfig/base.json', {
      paths: [appDir],
    });
    expect(fs.realpathSync(base)).toBe(
      fs.realpathSync(path.join(repoRoot, 'packages/tsconfig/base.json')),
    );
  });

  test('the legacy tsconfig reports TS5101 before migration', () => {
    const { codes } = configErrors('tsconfig.json');
    expect(codes).toContain(5101);
  });

  test('after the codemod, tsconfig.json has no config diagnostics', () => {
    execFileSync(process.execPath, [codemod, appDir], { stdio: 'pipe' });

    const tsconfig = JSON.parse(
      fs.readFileSync(path.join(appDir, 'tsconfig.json'), 'utf8'),
    );
    expect(tsconfig.compilerOptions.baseUrl).toBeUndefined();
    expect(tsconfig.compilerOptions.paths['@api/*']).toEqual([
      './api/lambda/*',
    ]);

    const { parsed, messages } = configErrors('tsconfig.json');
    expect(messages).toEqual([]);
    expect(parsed.options.moduleResolution).toBe(
      ts.ModuleResolutionKind.Bundler,
    );

    const result = tsc(['-p', 'tsconfig.json', '--noEmit']);
    expect(result.stdout + result.stderr).toBe('');
    expect(result.status).toBe(0);
  });

  test('the generated tsconfig.server.json compiles loadable CommonJS', async () => {
    const { parsed, messages } = configErrors('tsconfig.server.json');
    expect(messages).toEqual([]);
    expect(parsed.options.module).toBe(ts.ModuleKind.NodeNext);

    const result = tsc(['-p', 'tsconfig.server.json', '--outDir', 'dist']);
    expect(result.stdout + result.stderr).toBe('');
    expect(result.status).toBe(0);

    const emitted = path.join(appDir, 'dist/api/lambda/index.js');
    const code = fs.readFileSync(emitted, 'utf8');
    expect(code).toContain('require(');
    expect(code).not.toMatch(/^import /m);
    const lambda = require(emitted);
    expect(await lambda.get()).toEqual({ message: 'hello bff' });
  });
});
