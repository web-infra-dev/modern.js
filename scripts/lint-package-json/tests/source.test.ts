import { execFile } from 'node:child_process';
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import { describe, expect, it } from '@rstest/core';
import { extractReferences, getPackageName } from '../src/references';
import type { SourceInput } from '../src/sourceDependencies';
import {
  checkSourceDependencies,
  createSourceInput,
} from '../src/sourceDependencies';

const exec = promisify(execFile);
function input(files: Record<string, string>, changed?: string[]): SourceInput {
  return {
    root: path.resolve('/virtual/repository'),
    files: Object.keys(files),
    changed,
    read: async file => files[file],
  };
}
function packageFiles(code: string, dependencies: Record<string, string> = {}) {
  return {
    'package.json': '{"name":"root","private":true}',
    'packages/tool/package.json': JSON.stringify({
      name: 'tool',
      dependencies,
    }),
    'packages/tool/src/index.ts': code,
  };
}

describe('external references', () => {
  it('parses actual imports, exports, requires and type references, not code strings', () => {
    const code = [
      '// import foo from "comment"',
      'const template = `import foo from "template"`',
      'import type { Value } from "type-package"',
      'export { foo } from "export-package"',
      'const foo = require("require-package")',
      'const bar = import("dynamic-package")',
      'type Value = import("import-type").Value',
    ].join('\n');
    expect(
      extractReferences('index.ts', code).map(ref => ref.specifier),
    ).toEqual([
      'type-package',
      'export-package',
      'require-package',
      'dynamic-package',
      'import-type',
    ]);
    expect(extractReferences('index.ts', code)[0].typeOnly).toBe(true);
  });
  it('distinguishes optional detection from required imports', () => {
    const refs = extractReferences(
      'index.js',
      'require("required"); try { require("optional") } catch {} require.resolve("detect")',
    );
    expect(refs.map(ref => ref.optional)).toEqual([false, true, false]);
    expect(refs[2].resolutionOnly).toBe(true);
  });
  it('recognizes declaration path and type directives', () => {
    const refs = extractReferences(
      'index.d.ts',
      '/// <reference path="types/local.d.ts" />\n/// <reference types="react" />',
    );
    expect(refs.map(ref => ref.specifier)).toEqual([
      './types/local.d.ts',
      'react',
    ]);
    expect(refs.every(ref => ref.typeOnly)).toBe(true);
  });
  it('ignores builtins, local paths, imports maps and URL schemes', () => {
    for (const value of [
      'node:fs',
      'fs/promises',
      './local',
      '#internal',
      '/file',
      'virtual:module',
      'https://example.com/module',
    ]) {
      expect(getPackageName(value)).toBeNull();
    }
    expect(getPackageName('@scope/package/subpath')).toBe('@scope/package');
  });
});

describe('source dependency declarations', () => {
  it('reports undeclared imports with their package and source line', async () => {
    const issues = await checkSourceDependencies(
      input(packageFiles('import "missing"')),
    );
    expect(issues).toEqual([
      {
        package: 'tool',
        file: 'packages/tool/src/index.ts',
        line: 1,
        dependency: 'missing',
      },
    ]);
  });
  it('accepts source development, peer and optional declarations and package self references', async () => {
    const files = packageFiles(
      'import "dev"; import "peer"; import "optional"; import "tool/internal"',
    );
    files['packages/tool/package.json'] = JSON.stringify({
      name: 'tool',
      devDependencies: { dev: '1' },
      peerDependencies: { peer: '1' },
      optionalDependencies: { optional: '1' },
    });
    expect(await checkSourceDependencies(input(files))).toEqual([]);
  });
  it('accepts an explicitly declared @types provider only for type imports', async () => {
    expect(
      await checkSourceDependencies(
        input(
          packageFiles('import type { ReactNode } from "react"', {
            '@types/react': '1',
          }),
        ),
      ),
    ).toEqual([]);
    expect(
      await checkSourceDependencies(
        input(
          packageFiles('import React from "react"', { '@types/react': '1' }),
        ),
      ),
    ).toHaveLength(1);
  });
  it('resolves same-package paths and baseUrl without relying on hoisted node_modules', async () => {
    const files = {
      ...packageFiles('import "@local/value"; import "local"'),
      'packages/tool/tsconfig.json': JSON.stringify({
        compilerOptions: { baseUrl: '.', paths: { '@local/*': ['src/*'] } },
      }),
      'packages/tool/src/value.ts': 'export {}',
      'packages/tool/local/index.ts': 'export {}',
    };
    expect(await checkSourceDependencies(input(files))).toEqual([]);
  });
  it('reads inherited configurations with arbitrary JSON names and inherited path bases', async () => {
    const files = {
      ...packageFiles('import "@local/value"'),
      'packages/tool/tsconfig.json': '{"extends":"../../configs/base.json"}',
      'configs/base.json': JSON.stringify({
        compilerOptions: {
          paths: { '@local/*': ['../packages/tool/src/*'] },
        },
      }),
      'packages/tool/src/value.ts': 'export {}',
    };
    expect(await checkSourceDependencies(input(files))).toEqual([]);
  });

  it('checks consumers when a shared inherited JSON configuration changes', async () => {
    const files = {
      ...packageFiles('import "missing"'),
      'packages/tool/tsconfig.json': '{"extends":"../../base.json"}',
      'base.json': '{"compilerOptions":{"strict":true}}',
    };
    expect(
      await checkSourceDependencies(input(files, ['base.json'])),
    ).toHaveLength(1);
  });

  it('checks shared JSONC inheritance when an alias is removed', async () => {
    const files = {
      ...packageFiles('import "@local/value"'),
      'packages/tool/tsconfig.json': '{"extends":"../../base.jsonc"}',
      'base.jsonc':
        '{ // shared configuration\n "compilerOptions": {"baseUrl":".","paths":{}} }',
    };
    expect(
      await checkSourceDependencies(input(files, ['base.jsonc'])),
    ).toHaveLength(1);
  });

  it('does not treat another package mapped through paths as a local dependency', async () => {
    const files = {
      ...packageFiles('import "other"'),
      'packages/tool/tsconfig.json': JSON.stringify({
        compilerOptions: {
          baseUrl: '.',
          paths: { other: ['../other/src/index.ts'] },
        },
      }),
      'packages/other/package.json': '{"name":"other"}',
      'packages/other/src/index.ts': 'export {}',
    };
    expect(await checkSourceDependencies(input(files))).toHaveLength(1);
  });
  it('does not scan template or fixture source as its containing package', async () => {
    const files = {
      ...packageFiles('export {}'),
      'packages/tool/template/src/index.ts': 'import "template-dep"',
      'packages/tool/tests/fixtures/index.ts': 'import "fixture-dep"',
    };
    expect(await checkSourceDependencies(input(files))).toEqual([]);
  });
  it('checks the whole affected package when its manifest changes', async () => {
    const files = packageFiles('import "missing"');
    expect(
      await checkSourceDependencies(
        input(files, ['packages/tool/package.json']),
      ),
    ).toHaveLength(1);
    expect(
      await checkSourceDependencies(
        input(files, ['packages/other/src/index.ts']),
      ),
    ).toEqual([]);
  });
  it('uses staged inherited configuration rather than an unstaged replacement', async () => {
    const root = await mkdtemp(
      path.join(os.tmpdir(), 'dependency-config-index-'),
    );
    try {
      const files = {
        ...packageFiles('import "@local/value"'),
        'packages/tool/tsconfig.json': '{"extends":"../../base.json"}',
        'base.json': JSON.stringify({
          compilerOptions: {
            baseUrl: '.',
            paths: { '@local/*': ['packages/tool/src/*'] },
          },
        }),
        'packages/tool/src/value.ts': 'export {}',
      };
      await exec('git', ['init', '--quiet'], { cwd: root });
      for (const [file, code] of Object.entries(files)) {
        await mkdir(path.dirname(path.join(root, file)), { recursive: true });
        await writeFile(path.join(root, file), code);
      }
      await exec('git', ['add', '.'], { cwd: root });
      await writeFile(
        path.join(root, 'base.json'),
        '{"compilerOptions":{"baseUrl":".","paths":{}}}',
      );
      expect(
        await checkSourceDependencies(await createSourceInput(root, true)),
      ).toEqual([]);
      expect(
        await checkSourceDependencies(await createSourceInput(root)),
      ).toHaveLength(1);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it('reads staged source and declarations, not unstaged fixes', async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), 'dependency-index-'));
    try {
      const files = packageFiles('import "missing"');
      await exec('git', ['init', '--quiet'], { cwd: root });
      for (const [file, content] of Object.entries(files)) {
        await mkdir(path.dirname(path.join(root, file)), { recursive: true });
        await writeFile(path.join(root, file), content);
      }
      await exec('git', ['add', '.'], { cwd: root });
      await writeFile(
        path.join(root, 'packages/tool/package.json'),
        '{"name":"tool","dependencies":{"missing":"1"}}',
      );
      await writeFile(
        path.join(root, 'packages/tool/src/index.ts'),
        'export {}',
      );
      expect(
        await checkSourceDependencies(await createSourceInput(root, true)),
      ).toHaveLength(1);
      expect(
        await checkSourceDependencies(await createSourceInput(root)),
      ).toEqual([]);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });
});
