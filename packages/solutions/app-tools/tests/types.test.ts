import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const repoRoot = join(__dirname, '../../../..');

describe('app-tools types', () => {
  it('includes Rsbuild client types from the shared app-tools type reference', () => {
    const appToolsTypes = readFileSync(
      join(repoRoot, 'packages/solutions/app-tools/lib/types.d.ts'),
      'utf-8',
    );
    const tsconfig = JSON.parse(
      readFileSync(
        join(repoRoot, 'packages/toolkit/create/template/tsconfig.json'),
        'utf-8',
      ),
    );

    expect(appToolsTypes).toContain(
      '/// <reference types="@rsbuild/core/types" />',
    );
    expect(tsconfig.compilerOptions.types).toEqual([
      '@modern-js/app-tools/types',
    ]);
  });
});
