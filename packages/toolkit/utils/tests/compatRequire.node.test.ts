import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

// Use the built utility in a fresh Node process so Rstest's require/import
// hooks and earlier module evaluations cannot change the loader behavior.
const utilityPath = path.resolve(__dirname, '../dist/cjs/cli/require.js');

describe('compatibleRequire with native Node loaders', () => {
  let fixtureDirectory: string;

  beforeEach(() => {
    fixtureDirectory = mkdtempSync(
      path.join(tmpdir(), 'modern-compatible-require #%-'),
    );
  });

  afterEach(() => {
    rmSync(fixtureDirectory, { recursive: true, force: true });
  });

  const fixture = (name: string, source: string) => {
    const modulePath = path.join(fixtureDirectory, name);
    writeFileSync(modulePath, source);
    return modulePath;
  };

  const runInNode = (
    modulePath: string,
    assertions: string,
    flags: string[] = [],
  ) => {
    execFileSync(
      process.execPath,
      [
        ...flags,
        '-e',
        `const assert = require('node:assert/strict');
const { compatibleRequire } = require(process.argv[1]);
const modulePath = process.argv[2];
(async () => {
  ${assertions}
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});`,
        utilityPath,
        modulePath,
      ],
      {
        encoding: 'utf8',
        timeout: 10000,
        env: {
          ...process.env,
          NODE_ENV: 'test',
          NODE_OPTIONS: '',
        },
      },
    );
  };

  it('loads an ordinary CommonJS module', () => {
    const modulePath = fixture(
      'plugin.cjs',
      "module.exports = { name: 'commonjs-plugin' };",
    );

    runInNode(
      modulePath,
      "assert.deepEqual(await compatibleRequire(modulePath), { name: 'commonjs-plugin' });",
    );
  });

  it('preserves a require error without executing the module again', () => {
    const modulePath = fixture(
      'throwing.cjs',
      `globalThis.executions = (globalThis.executions || 0) + 1;
const cause = new Error('native addon permission check failed');
const error = new Error('real error from plugin', { cause });
error.code = 'ERR_DLOPEN_FAILED';
globalThis.pluginError = error;
throw error;`,
    );

    runInNode(
      modulePath,
      `await assert.rejects(compatibleRequire(modulePath), error => error === globalThis.pluginError);
assert.equal(globalThis.executions, 1);`,
    );
  });

  it.each(['null', 'undefined'])('preserves a thrown %s value', value => {
    const modulePath = fixture('throwing.cjs', `throw ${value};`);

    runInNode(
      modulePath,
      `await assert.rejects(compatibleRequire(modulePath), error => error === ${value});`,
    );
  });

  describe.each([
    { mode: 'require(esm) enabled', flags: [] },
    {
      mode: 'require(esm) disabled',
      flags: ['--no-experimental-require-module'],
    },
  ])('$mode', ({ flags }) => {
    it.each(['synchronous', 'top-level await'])(
      'loads a %s ESM module from a path containing URL-sensitive characters',
      kind => {
        const modulePath = fixture(
          'plugin #%.mjs',
          `${kind === 'top-level await' ? 'await Promise.resolve();' : ''}
export default { name: 'esm-plugin' };`,
        );

        runInNode(
          modulePath,
          "assert.deepEqual(await compatibleRequire(modulePath), { name: 'esm-plugin' });",
          flags,
        );
      },
    );

    it('preserves the module namespace when interop is disabled', () => {
      const modulePath = fixture(
        'namespace #%.mjs',
        `await Promise.resolve();
export const named = 42;
export default { name: 'esm-plugin' };`,
      );

      runInNode(
        modulePath,
        `const namespace = await compatibleRequire(modulePath, false);
assert.deepEqual(namespace.default, { name: 'esm-plugin' });
assert.equal(namespace.named, 42);`,
        flags,
      );
    });

    it('reports the actual error thrown after top-level await', () => {
      const modulePath = fixture(
        'throwing #%.mjs',
        `await Promise.resolve();
throw new Error('real asynchronous plugin error');`,
      );

      runInNode(
        modulePath,
        `await assert.rejects(compatibleRequire(modulePath), {
  message: 'real asynchronous plugin error',
});`,
        flags,
      );
    });
  });
});
