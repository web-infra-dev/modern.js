import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { mkdir, mkdtemp, realpath, rm, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

const require = createRequire(import.meta.url);
const cli = join(dirname(require.resolve('rstack/package.json')), 'bin/rs.js');
const config = fileURLToPath(
  new URL('../../rstack.config.mts', import.meta.url),
);
const execute = promisify(execFile);

test('finds unused bindings in a nested project without a root tsconfig', async () => {
  const root = await realpath(await mkdtemp(join(tmpdir(), 'modern-lint-')));
  const src = join(root, 'packages/fixture/src');

  const lint = async files => {
    const args = [
      cli,
      'lint',
      '--config',
      config,
      '--format',
      'jsonline',
      ...files,
    ];
    try {
      const { stdout } = await execute(process.execPath, args, { cwd: root });
      return { code: 0, stdout };
    } catch (error) {
      if (error.code !== 1) throw error;
      return { code: error.code, stdout: error.stdout };
    }
  };

  try {
    await mkdir(src, { recursive: true });
    await writeFile(
      join(src, '../tsconfig.json'),
      JSON.stringify({
        compilerOptions: { allowJs: true, jsx: 'react-jsx' },
        include: ['src'],
      }),
    );
    await writeFile(join(src, 'value.ts'), 'export const value = 1;\n');
    await writeFile(
      join(src, 'unused.ts'),
      [
        "import { value } from './value';",
        'const unusedLocal = 1;',
        "export function read(unusedParameter: string) { return 'ok'; }",
      ].join('\n'),
    );
    await writeFile(
      join(src, 'unused-javascript.js'),
      'const unusedJavaScript = 1;\n',
    );
    await writeFile(
      join(src, 'unused-jsx.tsx'),
      'const unusedTsx = 1;\nexport const App = () => <div />;\n',
    );

    const invalid = await lint([
      'packages/fixture/src/unused.ts',
      'packages/fixture/src/unused-javascript.js',
      'packages/fixture/src/unused-jsx.tsx',
    ]);
    assert.equal(invalid.code, 1, 'unused bindings must fail lint');
    const diagnostics = invalid.stdout
      .trim()
      .split('\n')
      .map(line => JSON.parse(line));
    assert.equal(diagnostics.length, 5, invalid.stdout);
    for (const name of [
      'value',
      'unusedLocal',
      'unusedParameter',
      'unusedJavaScript',
      'unusedTsx',
    ]) {
      assert.ok(
        diagnostics.some(
          diagnostic =>
            diagnostic.ruleName === '@typescript-eslint/no-unused-vars' &&
            diagnostic.message.startsWith(`'${name}' `),
        ),
        `missing unused binding diagnostic for ${name}: ${invalid.stdout}`,
      );
    }

    await writeFile(
      join(src, 'used.ts'),
      [
        "import { value } from './value';",
        'export function read(_unusedParameter: string) {',
        '  const usedLocal = value;',
        '  return usedLocal;',
        '}',
      ].join('\n'),
    );
    const valid = await lint(['packages/fixture/src/used.ts']);
    assert.equal(valid.code, 0, valid.stdout);
    assert.equal(valid.stdout, '');
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
