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
