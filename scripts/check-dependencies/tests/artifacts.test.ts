import { execFile } from 'node:child_process';
import {
  mkdir,
  mkdtemp,
  readFile,
  realpath,
  rm,
  symlink,
  writeFile,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { promisify } from 'node:util';
import { afterEach, describe, expect, it } from '@rstest/core';
import type {
  ArtifactManifest,
  ArtifactPackage,
} from '../src/packageArtifacts';
import {
  checkPackageArtifacts,
  inspectPackageArtifacts,
  listArtifactWorkspacePackages,
  packPackageArtifacts,
  parseArtifactManifest,
  selectPublishableArtifactPackages,
} from '../src/packageArtifacts';

import { pnpmInvocation, runPnpm } from '../src/packageManager';

const execute = promisify(execFile);
const temporaryDirectories = new Set<string>();

function manifest(overrides: Partial<ArtifactManifest> = {}): ArtifactManifest {
  return { name: '@fixture/published', version: '1.2.3', ...overrides };
}

async function temporaryDirectory() {
  const directory = await realpath(
    await mkdtemp(join(tmpdir(), 'modern-artifact-test-')),
  );
  temporaryDirectories.add(directory);
  return directory;
}

async function writeFiles(directory: string, files: Record<string, string>) {
  for (const [path, content] of Object.entries(files)) {
    const target = join(directory, path);
    await mkdir(dirname(target), { recursive: true });
    await writeFile(target, content);
  }
}

async function inspect(
  packageManifest: ArtifactManifest,
  files: Record<string, string>,
) {
  return inspectPackageArtifacts(
    packageManifest,
    new Set(Object.keys(files)),
    async path => {
      if (!(path in files)) {
        throw new Error(`Read outside packed file set: ${path}`);
      }
      return files[path];
    },
  );
}

async function packedFixture(
  packageManifest: ArtifactManifest,
  files: Record<string, string>,
  workspacePackages: ArtifactPackage[] = [],
) {
  const directory = await temporaryDirectory();
  await writeFiles(directory, {
    ...files,
    'package.json': JSON.stringify(packageManifest, null, 2),
  });
  const pkg = { directory, manifest: packageManifest };
  const packed = await packPackageArtifacts(pkg, [pkg, ...workspacePackages]);
  const originalCleanup = packed.cleanup;
  packed.cleanup = async () => {
    await originalCleanup();
    await rm(directory, { recursive: true, force: true });
    temporaryDirectories.delete(directory);
  };
  return { packed, directory };
}

afterEach(async () => {
  await Promise.all(
    [...temporaryDirectories].map(directory =>
      rm(directory, { recursive: true, force: true }),
    ),
  );
  temporaryDirectories.clear();
});

describe('published dependency declarations', () => {
  it('reports production JS references declared only in dev with path and line', async () => {
    const diagnostics = await inspect(
      manifest({
        main: './dist/index.js',
        devDependencies: { 'dev-only': '^1.0.0' },
      }),
      { 'dist/index.js': '\nconst helper = require("dev-only/subpath");\n' },
    );
    expect(diagnostics).toHaveLength(1);
    expect(diagnostics[0]).toMatchObject({
      packageName: '@fixture/published',
      path: 'dist/index.js',
      line: 2,
      rule: 'artifact-dependency',
    });
    expect(diagnostics[0].message).toContain('only in devDependencies');
  });

  it('checks public declarations through JS-style relative declaration imports', async () => {
    const diagnostics = await inspect(
      manifest({
        types: './dist/index.d.ts',
        devDependencies: { 'type-only': '*' },
      }),
      {
        'dist/index.d.ts': 'export type { Public } from "./public.js";',
        'dist/public.d.ts':
          '\nexport type Public = import("type-only").Public;',
        'dist/public.js': 'module.exports = {};',
        'dist/internal.d.ts': 'import "unused-internal-type";',
      },
    );
    expect(diagnostics).toHaveLength(1);
    expect(diagnostics[0]).toMatchObject({
      path: 'dist/public.d.ts',
      line: 2,
      rule: 'artifact-dependency',
    });
    expect(diagnostics[0].message).toContain('published types');
  });

  it('accepts prod, peer, optional and bundled-away dependencies', async () => {
    expect(
      await inspect(
        manifest({
          main: 'index.js',
          types: 'index.d.ts',
          dependencies: { production: '*' },
          peerDependencies: { peer: '*' },
          optionalDependencies: { optional: '*' },
          devDependencies: { 'bundled-away': '*' },
        }),
        {
          'index.js':
            'require("production"); import("peer"); require("optional"); const bundled = 1;',
          'index.d.ts': 'export type Public = import("peer").Public;',
        },
      ),
    ).toEqual([]);
  });

  it('reports confidently required undeclared imports, but permits caught host imports', async () => {
    const diagnostics = await inspect(manifest({ main: 'index.js' }), {
      'index.js': [
        'try { require("host-provided-native"); } catch {}',
        'try { require.resolve("host-configuration"); } catch {}',
        'require("missing-required");',
      ].join('\n'),
    });
    expect(diagnostics).toHaveLength(1);
    expect(diagnostics[0].line).toBe(3);
    expect(diagnostics[0].message).toContain('has no dependencies');
  });

  it('permits caught development resolution probes without waiving required resolution', async () => {
    const metadata = manifest({
      main: 'index.js',
      devDependencies: { tooling: '*' },
    });
    expect(
      await inspect(metadata, {
        'index.js': 'try { require.resolve("tooling/package.json"); } catch {}',
      }),
    ).toEqual([]);
    expect(
      await inspect(metadata, {
        'index.js': 'require.resolve("tooling/package.json");',
      }),
    ).toHaveLength(1);
  });

  it('accepts public host types supplied by a peer while retaining a local dev version', async () => {
    expect(
      await inspect(
        manifest({
          types: './index.d.ts',
          peerDependencies: { '@types/react': '^18.3.0 || ^19.0.0' },
          devDependencies: { '@types/react': '^19.3.0' },
        }),
        { 'index.d.ts': 'export type Root = import("react").ReactElement;' },
      ),
    ).toEqual([]);
  });

  it('does not waive a dev-only production import merely because it is caught', async () => {
    const diagnostics = await inspect(
      manifest({ main: 'index.js', devDependencies: { 'dev-only': '*' } }),
      { 'index.js': 'try { require("dev-only"); } catch {}' },
    );
    expect(diagnostics).toHaveLength(1);
    expect(diagnostics[0].rule).toBe('artifact-dependency');
  });

  it('follows vendored modules through nested manifests without treating them as packages', async () => {
    const diagnostics = await inspect(
      manifest({
        main: 'dist/index.js',
        devDependencies: { 'vendored-leak': '*' },
      }),
      {
        'dist/index.js': 'module.exports = require("./compiled/helper");',
        'dist/compiled/helper/package.json': JSON.stringify({
          name: 'vendored-helper',
          main: './lib/main.js',
          dependencies: { 'vendored-leak': '*' },
        }),
        'dist/compiled/helper/lib/main.js': 'require("vendored-leak");',
      },
    );
    expect(diagnostics).toHaveLength(1);
    expect(diagnostics[0].path).toBe('dist/compiled/helper/lib/main.js');
    expect(diagnostics[0].packageName).toBe('@fixture/published');
  });

  it('accepts production @types providers and reports dev-only public type providers', async () => {
    const files = {
      'index.d.ts': 'export type Public = import("@host/module").Public;',
    };
    expect(
      await inspect(
        manifest({
          types: './index.d.ts',
          dependencies: { '@types/host__module': '*' },
        }),
        files,
      ),
    ).toEqual([]);
    const diagnostics = await inspect(
      manifest({
        types: './index.d.ts',
        devDependencies: { '@types/host__module': '*' },
      }),
      files,
    );
    expect(diagnostics).toHaveLength(1);
    expect(diagnostics[0].message).toContain(
      '@types/host__module is only in devDependencies',
    );
  });

  it('follows triple-slash public declaration paths and type dependencies', async () => {
    const diagnostics = await inspect(
      manifest({
        types: './index.d.ts',
        devDependencies: { '@types/host': '*' },
      }),
      {
        'index.d.ts': '/// <reference path="./public.d.ts" />\nexport {};',
        'public.d.ts': '/// <reference types="host" />\nexport {};',
      },
    );
    expect(diagnostics).toHaveLength(1);
    expect(diagnostics[0].path).toBe('public.d.ts');
    expect(diagnostics[0].message).toContain(
      '@types/host is only in devDependencies',
    );
  });

  it('ignores builtin, local, self and URL refs while handling local cycles', async () => {
    expect(
      await inspect(manifest({ main: 'index.js' }), {
        'index.js':
          'require("fs"); require("node:path"); require("@fixture/published"); import("https://example.invalid/module.js"); require("#internal"); require("./other");',
        'other.js': 'require("./index.js");',
      }),
    ).toEqual([]);
  });

  it('preserves type context for public source types and their local graph', async () => {
    const files = {
      'public.ts': 'export { Host } from "./local.js";',
      'local.d.ts': 'export { Host } from "host";',
      'local.js': 'require("not-part-of-the-type-graph");',
    };
    expect(
      await inspect(
        manifest({
          types: './public.ts',
          dependencies: { '@types/host': '*' },
        }),
        files,
      ),
    ).toEqual([]);
    const diagnostics = await inspect(
      manifest({
        types: './public.ts',
        devDependencies: { '@types/host': '*' },
      }),
      files,
    );
    expect(diagnostics).toHaveLength(1);
    expect(diagnostics[0].path).toBe('local.d.ts');
    expect(diagnostics[0].message).toContain(
      '@types/host is only in devDependencies',
    );
  });

  it('does not treat runtime source or JSX exports as all-type-only', async () => {
    const files = {
      'public.tsx':
        'import { Host } from "host"; export const render = () => <Host />;',
    };
    const diagnostics = await inspect(
      manifest({
        types: './public.tsx',
        exports: { '.': { types: ['./public.tsx'], default: './public.tsx' } },
        dependencies: { '@types/host': '*' },
      }),
      files,
    );
    expect(diagnostics).toHaveLength(1);
    expect(diagnostics[0].message).toContain('published code');
    expect(diagnostics[0].message).toContain('host has no dependencies');
  });

  it('does not expand the entry gate into validation of every internal module', async () => {
    const diagnostics = await inspect(manifest({ main: 'index.js' }), {
      'index.js': '\nrequire("./not-packed.js");',
    });
    expect(diagnostics).toEqual([]);
  });
});

describe('package manager invocation', () => {
  it('uses the installed pnpm script directly on Windows, including spaces', () => {
    const script = 'C:\\Program Files\\pnpm\\bin\\pnpm.cjs';
    expect(pnpmInvocation(['pack', '--json'], script, 'win32')).toEqual({
      command: process.execPath,
      args: [script, 'pack', '--json'],
      shell: false,
    });
  });
  it('runs a standalone executable without a command shell', () => {
    const binary = 'C:\\tools\\pnpm.exe';
    expect(pnpmInvocation(['list'], binary, 'win32')).toEqual({
      command: binary,
      args: ['list'],
      shell: false,
    });
  });
});

describe('packed entry targets', () => {
  it('rejects broken types paths rather than silently skipping an unbuilt package', async () => {
    const diagnostics = await inspect(
      manifest({ main: 'dist/index.js', types: 'dist/types/index.d.ts' }),
      { 'dist/index.js': 'module.exports = {};' },
    );
    expect(diagnostics).toHaveLength(1);
    expect(diagnostics[0].rule).toBe('artifact-entry');
    expect(diagnostics[0].message).toContain('dist/types/index.d.ts');
  });

  it('accepts an unset main on a type-only package but still validates its public types', async () => {
    expect(
      await inspect(
        manifest({
          main: '',
          types: './index.d.ts',
          exports: { '.': { types: './index.d.ts', default: './index.d.ts' } },
        }),
        { 'index.d.ts': 'export {};' },
      ),
    ).toEqual([]);
    const diagnostics = await inspect(
      manifest({ main: '', types: './missing.d.ts' }),
      {},
    );
    expect(diagnostics).toHaveLength(1);
    expect(diagnostics[0].message).toContain('types target');
  });

  it('still inspects the implicit index.js runtime when main is empty and exports are absent', async () => {
    const diagnostics = await inspect(
      manifest({ main: '', devDependencies: { leak: '*' } }),
      {
        'index.js': 'require("leak");',
      },
    );
    expect(diagnostics).toHaveLength(1);
    expect(diagnostics[0].rule).toBe('artifact-dependency');
  });

  it('excludes only the confirmed workspace source condition, not unknown conditions or built targets', async () => {
    const diagnostics = await inspect(
      manifest({
        exports: {
          '.': {
            'modern:source': './unpublished/source.ts',
            node: {
              'modern:source': './src/node.ts',
              default: './dist/node.js',
            },
            'custom:runtime': './unpublished/runtime.js',
            default: './dist/index.js',
          },
        },
        devDependencies: { 'source-only': '*', 'published-leak': '*' },
      }),
      {
        'src/node.ts': 'require("source-only"); require("./missing-local.ts");',
        'dist/node.js': '',
        'dist/index.js': 'require("published-leak");',
      },
    );
    expect(diagnostics).toHaveLength(2);
    expect(
      diagnostics.some(diagnostic =>
        diagnostic.message.includes('custom:runtime'),
      ),
    ).toBe(true);
    expect(
      diagnostics.some(diagnostic =>
        diagnostic.message.includes('published-leak'),
      ),
    ).toBe(true);
    expect(
      diagnostics.some(diagnostic => diagnostic.path.startsWith('src/')),
    ).toBe(false);
  });

  it('checks nested conditions, null exports, arrays, bin and wildcard targets', async () => {
    expect(
      await inspect(
        manifest({
          main: './dist/index.cjs',
          module: './dist/index.mjs',
          types: './dist/index.d.ts',
          bin: { fixture: './bin/fixture.js' },
          exports: {
            '.': {
              types: './dist/index.d.ts',
              node: { import: './dist/index.mjs', require: './dist/index.cjs' },
              default: ['./invalid-but-ignored-later.js', './dist/index.cjs'],
            },
            './features/*': { default: './dist/features/*.js' },
            './hidden': null,
            './package.json': './package.json',
          },
          typesVersions: {
            '*': { '*': ['./missing-types/*.d.ts', './dist/features/*.d.ts'] },
          },
        }),
        {
          'dist/index.cjs': '',
          'dist/index.mjs': '',
          'dist/index.d.ts': '',
          'bin/fixture.js': '',
          'dist/features/one.js': '',
          'dist/features/one.d.ts': '',
          'package.json': '{}',
          // The first valid Node array target must exist, unlike TS path fallbacks.
          'invalid-but-ignored-later.js': '',
        },
      ),
    ).toEqual([]);
  });

  it('supports invalid Node array targets followed by a valid target', async () => {
    expect(
      await inspect(
        manifest({ exports: ['invalid-nonrelative', './index.js'] }),
        { 'index.js': '' },
      ),
    ).toEqual([]);
  });

  it('matches native Node when an unconditional conditional-object target ends an export array', async () => {
    const packageManifest = manifest({
      exports: [{ default: './index.js' }, './missing.js'],
    });
    const root = await temporaryDirectory();
    await writeFiles(root, {
      'node_modules/@fixture/published/package.json':
        JSON.stringify(packageManifest),
      'node_modules/@fixture/published/index.js': 'module.exports = 42;',
    });
    const native = await execute(
      process.execPath,
      ['-e', 'console.log(require("@fixture/published"))'],
      { cwd: root },
    );
    expect(native.stdout.trim()).toBe('42');
    expect(
      await inspect(packageManifest, { 'index.js': 'module.exports = 42;' }),
    ).toEqual([]);
  });

  it('retains fallbacks reachable through null or unmatched conditions', async () => {
    const packageManifest = manifest({
      exports: [{ blocked: null, default: './index.js' }, './missing.js'],
    });
    const diagnostics = await inspect(packageManifest, { 'index.js': '' });
    expect(diagnostics).toHaveLength(1);
    expect(diagnostics[0].message).toContain('./missing.js');
    expect(
      await inspect(manifest({ exports: [{ default: null }, './index.js'] }), {
        'index.js': '',
      }),
    ).toEqual([]);
  });

  it('skips invalid conditional-object targets caught by a resolving array fallback', async () => {
    expect(
      await inspect(
        manifest({ exports: [{ default: 'invalid-target' }, './index.js'] }),
        { 'index.js': '' },
      ),
    ).toEqual([]);
    expect(
      await inspect(manifest({ exports: ['invalid-target'] }), {
        'index.js': '',
      }),
    ).toHaveLength(1);
  });

  it('does not treat a missing valid Node array target as a file fallback', async () => {
    const diagnostics = await inspect(
      manifest({ exports: ['./missing.js', './index.js'] }),
      { 'index.js': '' },
    );
    expect(diagnostics).toHaveLength(1);
    expect(diagnostics[0].message).toContain('./missing.js');
  });

  it('checks Node shebang binaries without a filename extension', async () => {
    const packageManifest = manifest({
      bin: 'bin/tool',
      devDependencies: { 'dev-only': '*' },
    });
    const code = '#!/usr/bin/env node\nrequire("dev-only");';
    const root = await temporaryDirectory();
    await writeFiles(root, {
      'package.json': JSON.stringify(packageManifest),
      'bin/tool': code,
    });
    await expect(
      execute(process.execPath, ['bin/tool'], { cwd: root }),
    ).rejects.toMatchObject({
      code: 1,
      stderr: expect.stringContaining('MODULE_NOT_FOUND'),
    });
    expect(await inspect(packageManifest, { 'bin/tool': code })).toMatchObject([
      { path: 'bin/tool', line: 2, rule: 'artifact-dependency' },
    ]);
    expect(
      await inspect(
        manifest({ bin: 'bin/tool', dependencies: { supplied: '*' } }),
        {
          'bin/tool':
            '#!/usr/bin/env -S node --no-warnings\nrequire("supplied");',
        },
      ),
    ).toEqual([]);
  });

  it('does not mistake shell or native binaries for Node code', async () => {
    expect(
      await inspect(
        manifest({ bin: { shell: 'bin/shell', native: 'bin/native' } }),
        {
          'bin/shell': '#!/bin/sh\nnode -e \'require("not-a-js-entry")\'',
          'bin/native': '\u007fELF\u0000require("not-a-js-entry")',
        },
      ),
    ).toEqual([]);
  });

  it('resolves legacy directory and extensionless types entries', async () => {
    expect(
      await inspect(manifest({ main: './lib', types: './types/public' }), {
        'lib/index.js': '',
        'types/public.d.ts': '',
      }),
    ).toEqual([]);
  });

  it('does not require a build or invent an entry for entryless documentation/config packages', async () => {
    expect(
      await inspect(manifest(), { 'docs/guide.mdx': 'documentation' }),
    ).toEqual([]);
  });

  it('rejects nonexistent wildcard entries and paths outside the packed package', async () => {
    const diagnostics = await inspect(
      manifest({
        types: '../outside.d.ts',
        exports: { './features/*': './dist/features/*.js' },
        bin: './not-packed.js',
      }),
      {},
    );
    expect(diagnostics).toHaveLength(3);
    expect(
      diagnostics.every(diagnostic => diagnostic.rule === 'artifact-entry'),
    ).toBe(true);
  });
});

describe('actual isolated pnpm pack', () => {
  it('uses publishConfig main, types, bin and exports overrides without running lifecycles', async () => {
    const packageManifest = manifest({
      main: './source.js',
      types: './source.ts',
      bin: './source-bin.js',
      exports: './source.js',
      files: ['dist'],
      scripts: {
        prepack:
          "node -e \"require('fs').writeFileSync('lifecycle-ran', 'yes'); process.exit(23)\"",
        prepare: 'node -e "process.exit(24)"',
        postpack: 'node -e "process.exit(25)"',
      },
      publishConfig: {
        main: './dist/index.js',
        types: './dist/index.d.ts',
        bin: './dist/bin.js',
        exports: {
          '.': { types: './dist/index.d.ts', default: './dist/index.js' },
        },
        scripts: { prepack: 'node -e "process.exit(26)"' },
      },
    });
    const { packed, directory } = await packedFixture(packageManifest, {
      'dist/index.js': 'module.exports = {};',
      'dist/index.d.ts': 'export {};',
      'dist/bin.js': '#!/usr/bin/env node\n',
    });
    try {
      expect(packed.manifest.main).toBe('./dist/index.js');
      expect(packed.manifest.types).toBe('./dist/index.d.ts');
      const bin =
        typeof packed.manifest.bin === 'string'
          ? { published: packed.manifest.bin }
          : packed.manifest.bin;
      expect(bin).toEqual({ published: './dist/bin.js' });
      expect(packed.manifest.exports).toEqual(
        packageManifest.publishConfig &&
          (packageManifest.publishConfig as Record<string, unknown>).exports,
      );
      expect(packed.manifest.scripts).toBeUndefined();
      const publishConfig = packed.manifest.publishConfig as
        Record<string, unknown> | undefined;
      expect(publishConfig?.scripts).toBeUndefined();
      expect(
        JSON.parse(await readFile(join(directory, 'package.json'), 'utf8')),
      ).toEqual(packageManifest);
      expect(await readFile(join(directory, 'dist/index.js'), 'utf8')).toBe(
        'module.exports = {};',
      );
      expect(packed.files.has('lifecycle-ran')).toBe(false);
      expect(
        await inspectPackageArtifacts(packed.manifest, packed.files, path =>
          readFile(join(packed.directory, path), 'utf8'),
        ),
      ).toEqual([]);
    } finally {
      await packed.cleanup();
    }
  });

  it('accepts actual packed empty-main publication and unpublished modern:source entries', async () => {
    const { packed } = await packedFixture(
      manifest({
        files: ['public.d.ts'],
        types: './public.d.ts',
        publishConfig: { main: '' },
        exports: {
          '.': {
            types: './public.d.ts',
            'modern:source': './src/index.ts',
            default: './public.d.ts',
          },
        },
      }),
      {
        'public.d.ts': 'export {};',
        'src/index.ts': 'require("workspace-source-only");',
      },
    );
    try {
      expect(packed.manifest.main).toBe('');
      expect(packed.files.has('src/index.ts')).toBe(false);
      expect(
        await inspectPackageArtifacts(packed.manifest, packed.files, path =>
          readFile(join(packed.directory, path), 'utf8'),
        ),
      ).toEqual([]);
    } finally {
      await packed.cleanup();
    }
  });

  it('rejects a file present on disk but excluded from the actual tarball', async () => {
    const { packed, directory } = await packedFixture(
      manifest({
        main: './dist/index.js',
        types: './public.d.ts',
        files: ['dist'],
      }),
      { 'dist/index.js': '', 'public.d.ts': 'export {};' },
    );
    try {
      expect(await readFile(join(directory, 'public.d.ts'), 'utf8')).toBe(
        'export {};',
      );
      expect(packed.files.has('public.d.ts')).toBe(false);
      const diagnostics = await inspectPackageArtifacts(
        packed.manifest,
        packed.files,
        path => readFile(join(packed.directory, path), 'utf8'),
      );
      expect(diagnostics).toHaveLength(1);
      expect(diagnostics[0].rule).toBe('artifact-entry');
    } finally {
      await packed.cleanup();
    }
  });

  it('preserves workspace range publication without installing or reading the network', async () => {
    const dependencyDirectory = await temporaryDirectory();
    const dependency = {
      directory: dependencyDirectory,
      manifest: manifest({ name: '@fixture/dependency', version: '4.5.6' }),
    };
    const { packed } = await packedFixture(
      manifest({
        main: './index.js',
        dependencies: {
          '@fixture/dependency': 'workspace:*',
          alias: 'workspace:@fixture/dependency@^',
        },
        devDependencies: { '@fixture/dependency': 'workspace:^' },
        peerDependencies: { '@fixture/dependency': 'workspace:~' },
        optionalDependencies: { '@fixture/dependency': 'workspace:^4.0.0' },
      }),
      { 'index.js': '' },
      [dependency],
    );
    try {
      expect(packed.manifest.dependencies).toEqual({
        '@fixture/dependency': '4.5.6',
        alias: 'npm:@fixture/dependency@^4.5.6',
      });
      expect(packed.manifest.devDependencies).toEqual({
        '@fixture/dependency': '^4.5.6',
      });
      expect(packed.manifest.peerDependencies).toEqual({
        '@fixture/dependency': '~4.5.6',
      });
      expect(packed.manifest.optionalDependencies).toEqual({
        '@fixture/dependency': '^4.0.0',
      });
    } finally {
      await packed.cleanup();
    }
  });

  it('matches native pnpm publication for workspace aliases and relative dependencies', async () => {
    const root = await temporaryDirectory();
    const directory = join(root, 'published');
    const dependency = {
      directory: join(root, 'dependency'),
      manifest: manifest({ name: '@fixture/dependency', version: '4.5.6' }),
    };
    const packageManifest = manifest({
      main: './index.js',
      files: ['index.js'],
      dependencies: {
        '@fixture/dependency': 'workspace:*',
        alias: 'workspace:@fixture/dependency@^',
        relative: 'workspace:../dependency',
      },
      devDependencies: { '@fixture/dependency': 'workspace:^' },
      peerDependencies: { '@fixture/dependency': 'workspace:~' },
      optionalDependencies: { '@fixture/dependency': 'workspace:^4.0.0' },
    });
    await writeFiles(root, {
      'pnpm-workspace.yaml': "packages:\n  - 'published'\n  - 'dependency'\n",
      'published/package.json': JSON.stringify(packageManifest),
      'published/index.js': '',
      'dependency/package.json': JSON.stringify(dependency.manifest),
    });
    // Installed workspace links, isolated fixtures only: no install or network.
    await mkdir(join(directory, 'node_modules/@fixture'), { recursive: true });
    for (const name of ['@fixture/dependency', 'alias', 'relative']) {
      await symlink(
        dependency.directory,
        join(directory, 'node_modules', name),
        'junction',
      );
    }
    const output = join(root, 'native');
    await mkdir(output);
    const { stdout } = await runPnpm(
      ['pack', '--json', '--pack-destination', output],
      { cwd: directory },
    );
    const archive = JSON.parse(stdout) as { filename: string };
    const { stdout: nativeManifest } = await execute('tar', [
      '-xOf',
      archive.filename,
      'package/package.json',
    ]);
    const expected = parseArtifactManifest(nativeManifest);
    const pkg = { directory, manifest: packageManifest };
    const packed = await packPackageArtifacts(pkg, [pkg, dependency]);
    try {
      for (const field of [
        'dependencies',
        'devDependencies',
        'peerDependencies',
        'optionalDependencies',
      ] as const) {
        expect(packed.manifest[field]).toEqual(expected[field]);
      }
    } finally {
      await packed.cleanup();
    }
  });

  it('reports unresolved workspace dependencies as packing failures rather than skipping', async () => {
    const root = await temporaryDirectory();
    await writeFiles(root, {
      'package.json': JSON.stringify({ name: 'fixture-root', private: true }),
      'pnpm-workspace.yaml': "packages:\n  - 'packages/*'\n",
      'packages/broken/package.json': JSON.stringify(
        manifest({
          main: './index.js',
          dependencies: { missing: 'workspace:*' },
        }),
      ),
      'packages/broken/index.js': '',
    });
    const result = await checkPackageArtifacts(root);
    expect(result.packages).toBe(1);
    expect(result.diagnostics).toMatchObject([
      { rule: 'artifact-pack', path: 'package.json', line: 1 },
    ]);
    expect(result.diagnostics[0].message).toContain(
      'Cannot resolve missing@workspace:*',
    );
  });
});

describe('publishable workspace scope', () => {
  it('uses actual workspace membership and excludes private, scripts, tests, examples and nested templates', async () => {
    const root = await temporaryDirectory();
    await writeFiles(root, {
      'package.json': JSON.stringify({ name: 'fixture-root', private: true }),
      'pnpm-workspace.yaml':
        "packages:\n  - 'packages/*'\n  - 'scripts/*'\n  - 'examples/*'\n  - 'tests'\n",
      'packages/public/package.json': JSON.stringify(manifest()),
      'packages/public/template/package.json': JSON.stringify(
        manifest({ name: 'nested-template' }),
      ),
      'packages/private/package.json': JSON.stringify(
        manifest({ name: 'private', private: true }),
      ),
      'scripts/tool/package.json': JSON.stringify(manifest({ name: 'tool' })),
      'examples/app/package.json': JSON.stringify(
        manifest({ name: 'example' }),
      ),
      'tests/package.json': JSON.stringify(manifest({ name: 'tests' })),
    });
    const workspacePackages = await listArtifactWorkspacePackages(root);
    const selected = selectPublishableArtifactPackages(root, workspacePackages);
    expect(selected.map(pkg => pkg.manifest.name)).toEqual([
      '@fixture/published',
    ]);
    expect(
      workspacePackages.some(pkg => pkg.manifest.name === 'nested-template'),
    ).toBe(false);
    for (const excluded of [
      'packages/private',
      'scripts/tool',
      'examples/app',
      'tests',
      'packages/public/template',
    ]) {
      expect(() =>
        selectPublishableArtifactPackages(root, workspacePackages, [excluded]),
      ).toThrow('Not a publishable workspace package');
    }
    expect(
      selectPublishableArtifactPackages(root, workspacePackages, [
        'packages/public',
      ]),
    ).toEqual(selected);
    expect((await checkPackageArtifacts(root)).diagnostics).toEqual([]);
  });

  it('prints package, packed path, line and rule and exits nonzero for an artifact violation', async () => {
    const root = await temporaryDirectory();
    const checker = resolve(__dirname, '..');
    const isolatedChecker = join(root, 'scripts/check-dependencies');
    await writeFiles(root, {
      'package.json': JSON.stringify({ name: 'fixture-root', private: true }),
      'pnpm-workspace.yaml': "packages:\n  - 'packages/*'\n",
      'packages/public/package.json': JSON.stringify(
        manifest({
          main: './dist/index.js',
          files: ['dist'],
          devDependencies: { 'dev-only': '*' },
        }),
      ),
      'packages/public/dist/index.js': '\nrequire("dev-only");',
    });
    for (const file of [
      'checkArtifacts.ts',
      'packageArtifacts.ts',
      'packageManager.ts',
      'references.ts',
    ]) {
      await writeFiles(isolatedChecker, {
        [`src/${file}`]: await readFile(join(checker, 'src', file), 'utf8'),
      });
    }
    await symlink(
      join(checker, 'node_modules'),
      join(isolatedChecker, 'node_modules'),
      'junction',
    );
    await expect(
      execute(
        process.execPath,
        [
          require.resolve('tsx/cli'),
          join(isolatedChecker, 'src/checkArtifacts.ts'),
        ],
        { cwd: root },
      ),
    ).rejects.toMatchObject({
      code: 1,
      stderr: expect.stringContaining(
        '@fixture/published dist/index.js:2 [artifact-dependency]',
      ),
    });
  });

  it('rejects private directory CLI arguments with a nonzero exit', async () => {
    const checker = resolve(__dirname, '..');
    await expect(
      execute(
        process.execPath,
        [
          require.resolve('tsx/cli'),
          join(checker, 'src/checkArtifacts.ts'),
          checker,
        ],
        { cwd: checker },
      ),
    ).rejects.toMatchObject({
      code: 1,
      stderr: expect.stringContaining('Not a publishable workspace package'),
    });
  });

  it('validates manifest shapes without falsely requiring a root workspace version', () => {
    expect(parseArtifactManifest('{"name":"root","private":true}')).toEqual({
      name: 'root',
      private: true,
    });
    expect(() =>
      parseArtifactManifest('{"name":"invalid","dependencies":{"dep":7}}'),
    ).toThrow('Invalid dependencies');
  });
});
