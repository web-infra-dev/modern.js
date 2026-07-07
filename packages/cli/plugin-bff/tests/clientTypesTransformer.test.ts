import os from 'os';
import path from 'path';
import { fs } from '@modern-js/utils';
import ts from 'typescript';
import { createImportTypeRetargetTransformer } from '../src/utils/clientTypesTransformer';

// Real tsc declaration emit against a fixture package, so the tests prove
// the d.ts is correct at the moment it is generated — not that some text
// replacement works on a hand-written string.
const setupFixture = async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'bff-dts-transform-'));
  const pkgDir = path.join(dir, 'node_modules', 'fake-bff-core');
  await fs.outputFile(
    path.join(pkgDir, 'package.json'),
    JSON.stringify({
      name: 'fake-bff-core',
      version: '1.0.0',
      main: 'index.js',
      types: 'index.d.ts',
    }),
  );
  await fs.outputFile(path.join(pkgDir, 'index.js'), 'exports.Api = f => f;');
  await fs.outputFile(
    path.join(pkgDir, 'index.d.ts'),
    [
      'export type ApiRunner<I, O> = (input: I) => O;',
      'export declare function Api<I, O>(handler: (input: I) => O): ApiRunner<I, O>;',
    ].join('\n'),
  );
  await fs.outputFile(
    path.join(dir, 'upload.ts'),
    [
      "import { Api } from 'fake-bff-core';",
      'export const upload = Api((input: { name: string }) =>',
      '  Promise.resolve({ code: 0 }),',
      ');',
    ].join('\n'),
  );
  return dir;
};

const emitDts = async (
  dir: string,
  transformerFactory?: ReturnType<typeof createImportTypeRetargetTransformer>,
) => {
  const program = ts.createProgram([path.join(dir, 'upload.ts')], {
    declaration: true,
    emitDeclarationOnly: true,
    outDir: path.join(dir, 'dist'),
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2020,
    moduleResolution: ts.ModuleResolutionKind.Node10,
    strict: true,
  });
  const result = program.emit(undefined, undefined, undefined, true, {
    afterDeclarations: transformerFactory
      ? [transformerFactory(ts)]
      : undefined,
  });
  expect(result.diagnostics).toHaveLength(0);
  return fs.readFile(path.join(dir, 'dist', 'upload.d.ts'), 'utf8');
};

describe('createImportTypeRetargetTransformer', () => {
  it('tsc synthesizes an import type of the declaring package by default', async () => {
    const dir = await setupFixture();
    const dts = await emitDts(dir);
    // the leak this feature exists to fix
    expect(dts).toContain('import("fake-bff-core").ApiRunner');
  });

  it('retargets synthesized import types at declaration emit', async () => {
    const dir = await setupFixture();
    const dts = await emitDts(
      dir,
      createImportTypeRetargetTransformer('fake-bff-core', '@edenx/plugin-bff'),
    );
    expect(dts).not.toContain('fake-bff-core');
    expect(dts).toContain('import("@edenx/plugin-bff").ApiRunner');
    // the rest of the declaration is untouched
    expect(dts).toContain('export declare const upload:');
    expect(dts).toContain('name: string');
  });

  it('leaves other module specifiers untouched', async () => {
    const dir = await setupFixture();
    const dts = await emitDts(
      dir,
      createImportTypeRetargetTransformer(
        'some-other-package',
        '@edenx/plugin-bff',
      ),
    );
    expect(dts).toContain('import("fake-bff-core").ApiRunner');
    expect(dts).not.toContain('@edenx/plugin-bff');
  });
});

// ---------------------------------------------------------------------------
// pnpm layout (what real installed projects look like): the declaring package
// lives inside the .pnpm virtual store and is only reachable through a
// symlink in the importing package's own node_modules. These tests lock the
// two behavioral boundaries of the cross-project types design:
//   1. producer-side TS2742 is prevented by the runtime entry re-exporting
//      the factory's return types — the declaration-emit name resolver walks
//      the export chain of modules the api file already imports;
//   2. the afterDeclarations transformer cannot rescue TS2742 — diagnostics
//      are produced while the declaration AST is synthesized, before any
//      afterDeclarations transformer runs — so the transformer is a
//      consumer-side retarget, not a producer-side fix.
const setupPnpmFixture = async (runtimeEntryDts: string) => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'bff-dts-pnpm-'));
  const coreDir = path.join(
    dir,
    'node_modules',
    '.pnpm',
    'fake-bff-core@1.0.0',
    'node_modules',
    'fake-bff-core',
  );
  await fs.outputFile(
    path.join(coreDir, 'package.json'),
    JSON.stringify({
      name: 'fake-bff-core',
      version: '1.0.0',
      main: 'index.js',
      types: 'index.d.ts',
    }),
  );
  await fs.outputFile(path.join(coreDir, 'index.js'), 'exports.Api = f => f;');
  await fs.outputFile(
    path.join(coreDir, 'index.d.ts'),
    [
      'export type ApiRunner<I, O> = (input: I) => O;',
      'export declare function Api<I, O>(handler: (input: I) => O): ApiRunner<I, O>;',
    ].join('\n'),
  );
  // the runtime package users actually import from (think
  // `@modern-js/plugin-bff/server` or `@edenx/plugin-gulux/runtime`), with
  // its dependency wired through the .pnpm store like pnpm does
  const runtimeDir = path.join(dir, 'node_modules', 'fake-runtime');
  await fs.outputFile(
    path.join(runtimeDir, 'package.json'),
    JSON.stringify({
      name: 'fake-runtime',
      version: '1.0.0',
      main: 'index.js',
      types: 'index.d.ts',
    }),
  );
  await fs.outputFile(
    path.join(runtimeDir, 'index.js'),
    'module.exports = require("fake-bff-core");',
  );
  await fs.outputFile(path.join(runtimeDir, 'index.d.ts'), runtimeEntryDts);
  await fs.ensureSymlink(
    coreDir,
    path.join(runtimeDir, 'node_modules', 'fake-bff-core'),
    'junction',
  );
  await fs.outputFile(
    path.join(dir, 'api.ts'),
    [
      "import { Api } from 'fake-runtime';",
      'export const getUser = Api((input: { id: string }) =>',
      '  Promise.resolve({ id: input.id }),',
      ');',
    ].join('\n'),
  );
  return dir;
};

const emitDtsCollectingDiagnostics = async (
  dir: string,
  transformerFactory?: ReturnType<typeof createImportTypeRetargetTransformer>,
) => {
  const program = ts.createProgram([path.join(dir, 'api.ts')], {
    declaration: true,
    emitDeclarationOnly: true,
    outDir: path.join(dir, 'dist'),
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2020,
    moduleResolution: ts.ModuleResolutionKind.Node10,
    strict: true,
  });
  let dts = '';
  const result = program.emit(
    undefined,
    (_fileName, text) => {
      dts = text;
    },
    undefined,
    true,
    {
      afterDeclarations: transformerFactory
        ? [transformerFactory(ts)]
        : undefined,
    },
  );
  const codes = ts
    .getPreEmitDiagnostics(program)
    .concat(result.diagnostics)
    .map(d => d.code);
  return { dts, codes };
};

describe('cross-project types under a pnpm layout', () => {
  it('emits a portable reference through the runtime entry when it re-exports the whole type surface', async () => {
    const dir = await setupPnpmFixture("export * from 'fake-bff-core';\n");
    const { dts, codes } = await emitDtsCollectingDiagnostics(
      dir,
      // transformer active but a no-op here: the emitted reference already
      // points at the runtime entry, not at the declaring package
      createImportTypeRetargetTransformer('fake-bff-core', '@edenx/plugin-bff'),
    );
    expect(codes).toHaveLength(0);
    expect(dts).toContain('import("fake-runtime").ApiRunner');
    expect(dts).not.toContain('.pnpm');
  });

  it('reports TS2742 when the runtime entry re-exports only values — the transformer cannot rescue producer-side emit', async () => {
    const dir = await setupPnpmFixture("export { Api } from 'fake-bff-core';\n");
    const { codes } = await emitDtsCollectingDiagnostics(
      dir,
      createImportTypeRetargetTransformer('fake-bff-core', '@edenx/plugin-bff'),
    );
    expect(codes).toContain(2742);
  });
});
