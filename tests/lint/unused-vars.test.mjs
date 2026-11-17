import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { test } from 'node:test';
import { withLintFixture } from './fixture.mjs';

test('finds unused bindings in a nested project without a root tsconfig', async () => {
  await withLintFixture(async ({ src, lint }) => {
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
  });
});
