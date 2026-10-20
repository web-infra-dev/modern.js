import { readFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { createProject } from '../../../toolkit/create/src/template';
import { join } from 'node:path';

const repoRoot = join(__dirname, '../../../..');

describe('app-tools types', () => {
  it('includes Rsbuild client types from the shared app-tools type reference', () => {
    const appToolsTypes = readFileSync(
      join(repoRoot, 'packages/solutions/app-tools/lib/types.d.ts'),
      'utf-8',
    );
    const directory = mkdtempSync(join(tmpdir(), 'modern-app-types-'));
    let tsconfig;
    try {
      createProject(directory, {
        packageName: 'app-types',
        version: '3.10.0',
        template: 'app',
        mf: false,
        isSubproject: true,
        noAgentsMd: true,
      });
      tsconfig = JSON.parse(
        readFileSync(join(directory, 'tsconfig.json'), 'utf8'),
      );
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }

    expect(appToolsTypes).toContain(
      '/// <reference types="@rsbuild/core/types" />',
    );
    expect(tsconfig.compilerOptions.types).toEqual([
      '@modern-js/app-tools/types',
    ]);
  });
});
