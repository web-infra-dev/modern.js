import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crossSpawn from 'cross-spawn';
import ts from 'typescript';
import {
  createIsolatedTestApp,
  modernBuild,
} from '../../../utils/modernTestUtils';

rstest.setConfig({ testTimeout: 1000 * 60 * 3, hookTimeout: 1000 * 60 * 3 });

const sourceApiAppDir = path.resolve(__dirname, '../bff-api-app');

// Type-check `consumerDir` in isolation and return the diagnostics. An unused
// `@ts-expect-error` also surfaces here (TS2578), so a type that silently
// degraded to `any` fails the check just like a missing declaration would.
function typeCheck(consumerDir: string): ts.Diagnostic[] {
  const configPath = path.join(consumerDir, 'tsconfig.json');
  const parsed = ts.getParsedCommandLineOfConfigFile(
    configPath,
    {},
    ts.sys as unknown as ts.ParseConfigFileHost,
  )!;
  const program = ts.createProgram({
    rootNames: parsed.fileNames,
    options: parsed.options,
  });
  return [...ts.getPreEmitDiagnostics(program)];
}

describe('crossProject client type portability', () => {
  // The published package must type-check for a consumer that has no access to
  // the source workspace: no path aliases, no symlinks, no stubs. This is the
  // real regression surface — "resolvable in the local dist" is not the same as
  // "resolvable from the packed tarball".
  it('a packed tarball resolves the client types from an isolated consumer', async () => {
    // Build and pack a copy: `index.test.ts` runs dev servers from the source
    // fixture in a parallel test file, and a build there would empty its dist
    // under the running server. `dist-1` is this fixture's output directory,
    // so it must be excluded too — the copy has to start without stale (or
    // half-written) build output.
    const { appDir: apiAppDir, cleanup } = await createIsolatedTestApp(
      sourceApiAppDir,
      { exclude: ['dist-1'] },
    );

    const workDir = fs.mkdtempSync(path.join(os.tmpdir(), 'bff-portability-'));
    try {
      const manifest = path.join(apiAppDir, 'package.json');
      const pkg = JSON.parse(fs.readFileSync(manifest, 'utf8'));
      // The checked-in manifest already contains the output of an earlier build.
      delete pkg.exports;
      delete pkg.files;
      delete pkg.typesVersions;
      fs.writeFileSync(manifest, JSON.stringify(pkg));
      const lambda = path.join(apiAppDir, 'api/lambda');
      fs.writeFileSync(
        path.join(lambda, 'stray.test.ts'),
        'export default () => 1;',
      );
      fs.writeFileSync(
        path.join(lambda, 'stray.d.ts'),
        'export declare const ignored: string;',
      );
      const build = await modernBuild(apiAppDir);
      expect(build.code, build.stderr || build.stdout).toBe(0);

      const generated = fs.readFileSync(manifest, 'utf8');
      expect(generated.endsWith('\n')).toBe(true);
      const generatedPkg = JSON.parse(generated);
      expect(generatedPkg.files).toContain('dist-1/**/*.d.ts');
      const publicApis = Object.keys(generatedPkg.exports);
      expect(publicApis).toContain('./api/user/index');
      expect(publicApis).not.toContain('./api/stray.test');
      expect(publicApis).not.toContain('./api/stray.d');

      // 1. Pack exactly what would be published.
      //    Spawned through cross-spawn: on Windows `pnpm` is a `.cmd` shim,
      //    which node refuses to execute directly (ENOENT for the bare name,
      //    EINVAL for the `.cmd` since the CVE-2024-27980 fix). cross-spawn
      //    routes it through the shell and quotes the arguments itself.
      const pack = crossSpawn.sync(
        'pnpm',
        ['pack', '--pack-destination', workDir],
        {
          cwd: apiAppDir,
          stdio: 'pipe',
        },
      );
      if (pack.status !== 0) {
        throw new Error(
          `pnpm pack failed (${pack.status ?? pack.error}): ${pack.stderr?.toString() ?? ''}`,
        );
      }
      const tarball = fs
        .readdirSync(workDir)
        .find(name => name.endsWith('.tgz'));
      expect(tarball).toBeTruthy();

      // 2. Install by extracting the tarball into an isolated node_modules —
      //    no workspace symlink, no dependency hoisting.
      const consumerDir = path.join(workDir, 'consumer');
      const pkgDir = path.join(consumerDir, 'node_modules', 'bff-api-app');
      fs.mkdirSync(pkgDir, { recursive: true });
      execFileSync(
        'tar',
        [
          '-xzf',
          path.join(workDir, tarball!),
          '-C',
          pkgDir,
          '--strip-components=1',
        ],
        { stdio: 'pipe' },
      );

      // 3. The declaration closure the client re-exports must actually ship.
      const shippedShared = path.join(pkgDir, 'dist-1', 'shared', 'types.d.ts');
      const shippedOrigin = path.join(
        pkgDir,
        'dist-1',
        'api',
        'lambda',
        'portable.d.ts',
      );
      const shippedFacade = path.join(
        pkgDir,
        'dist-1',
        'client',
        'portable.d.ts',
      );
      expect(fs.existsSync(shippedShared)).toBe(true);
      expect(fs.existsSync(shippedOrigin)).toBe(true);
      expect(fs.existsSync(shippedFacade)).toBe(true);

      // No tsconfig path alias may leak into the published declarations.
      expect(fs.readFileSync(shippedOrigin, 'utf8')).not.toContain('@shared');
      // The facade re-exports the in-place declaration, it does not copy it.
      expect(fs.readFileSync(shippedFacade, 'utf8')).toContain(
        `from '../api/lambda/portable'`,
      );

      const clientDir = path.join(pkgDir, 'dist-1', 'client');
      const upload = fs.readFileSync(
        path.join(clientDir, 'upload.d.ts'),
        'utf8',
      );
      expect(upload).toContain(`export * from '../api/lambda/upload'`);
      expect(upload).not.toContain('export { default }');
      expect(
        fs.readFileSync(path.join(clientDir, 'user/index.d.ts'), 'utf8'),
      ).toContain(`export * from '../../api/lambda/user/index'`);
      expect(
        fs.readdirSync(clientDir).filter(name => name.startsWith('stray.')),
      ).toEqual([]);

      // 4. Isolated consumer that exercises the resolved type.
      fs.writeFileSync(
        path.join(consumerDir, 'index.ts'),
        [
          `import portable from 'bff-api-app/api/portable';`,
          ``,
          `export async function check() {`,
          `  const msg = await portable();`,
          `  const from: string = msg.from;`,
          `  // @ts-expect-error 'message' is a string, so this must error. If the`,
          `  // type had degraded to any/unknown the directive would be unused (TS2578).`,
          `  const bad: number = msg.message;`,
          `  return { from, bad };`,
          `}`,
          ``,
        ].join('\n'),
      );
      fs.writeFileSync(
        path.join(consumerDir, 'tsconfig.json'),
        JSON.stringify(
          {
            compilerOptions: {
              noEmit: true,
              strict: true,
              skipLibCheck: false,
              module: 'esnext',
              moduleResolution: 'bundler',
              types: [],
            },
            include: ['index.ts'],
          },
          null,
          2,
        ),
      );

      const diagnostics = typeCheck(consumerDir);
      const messages = diagnostics.map(d =>
        ts.flattenDiagnosticMessageText(d.messageText, '\n'),
      );
      expect(messages).toEqual([]);
    } finally {
      fs.rmSync(workDir, { recursive: true, force: true });
      await cleanup();
    }
  });

  it('generates explicit .js re-exports for native ESM clients', async () => {
    const { appDir, cleanup } = await createIsolatedTestApp(sourceApiAppDir, {
      exclude: ['dist-1'],
    });
    try {
      const manifest = path.join(appDir, 'package.json');
      const pkg = JSON.parse(fs.readFileSync(manifest, 'utf8'));
      fs.writeFileSync(manifest, JSON.stringify({ ...pkg, type: 'module' }));
      const tsconfigPath = path.join(appDir, 'tsconfig.json');
      const tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, 'utf8'));
      tsconfig.compilerOptions.module = 'esnext';
      tsconfig.compilerOptions.moduleResolution = 'bundler';
      fs.writeFileSync(tsconfigPath, JSON.stringify(tsconfig));
      const build = await modernBuild(appDir);
      expect(build.code, build.stderr || build.stdout).toBe(0);

      const facade = fs.readFileSync(
        path.join(appDir, 'dist-1/client/portable.d.ts'),
        'utf8',
      );
      expect(facade).toContain(
        `export { default } from '../api/lambda/portable.js'`,
      );
      expect(facade).toContain(`export * from '../api/lambda/portable.js'`);
    } finally {
      await cleanup();
    }
  });
});
