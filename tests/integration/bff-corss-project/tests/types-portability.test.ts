import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import ts from 'typescript';
import { modernBuild } from '../../../utils/modernTestUtils';

rstest.setConfig({ testTimeout: 1000 * 60 * 3, hookTimeout: 1000 * 60 * 3 });

const apiAppDir = path.resolve(__dirname, '../bff-api-app');

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
    await modernBuild(apiAppDir, [], {});

    const workDir = fs.mkdtempSync(path.join(os.tmpdir(), 'bff-portability-'));
    try {
      // 1. Pack exactly what would be published.
      execFileSync('pnpm', ['pack', '--pack-destination', workDir], {
        cwd: apiAppDir,
        stdio: 'pipe',
      });
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
    }
  });
});
