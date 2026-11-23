import childProcess from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

describe('swc-loader', () => {
  const loaderPath = path.resolve(__dirname, '../../src/esm/swc-loader.mjs');

  function createTmpApp() {
    const rootDir = fs.mkdtempSync(path.join(os.tmpdir(), 'app-tools-loader-'));
    const appDir = path.join(rootDir, 'app');
    const tsconfigPath = path.join(rootDir, 'tsconfig.json');
    fs.mkdirSync(appDir, { recursive: true });
    fs.writeFileSync(
      tsconfigPath,
      JSON.stringify({
        compilerOptions: {
          target: 'ES2020',
          module: 'NodeNext',
          moduleResolution: 'NodeNext',
        },
      }),
    );
    return { rootDir, appDir, tsconfigPath };
  }

  it('should resolve prefix aliases from source.alias to TypeScript files', async () => {
    const { rootDir, appDir, tsconfigPath } = createTmpApp();
    const serviceDir = path.join(rootDir, 'service');
    const serviceFile = path.join(serviceDir, 'user.ts');

    fs.mkdirSync(serviceDir, { recursive: true });
    fs.writeFileSync(serviceFile, 'export const user = 1;\n');

    try {
      const output = childProcess.execFileSync(
        process.execPath,
        [
          '-e',
          `
            const { pathToFileURL } = require('node:url');

            (async () => {
              const loader = await import(
                pathToFileURL(${JSON.stringify(loaderPath)}).href,
              );
              await loader.initialize({
                appDir: ${JSON.stringify(appDir)},
                baseUrl: ${JSON.stringify(appDir)},
                paths: {
                  '@service': [${JSON.stringify('../service')}],
                  '@service/*': [${JSON.stringify('../service/*')}],
                },
              });
              const resolved = {};
              for (const specifier of ['@service/user', '@service/user.js']) {
                resolved[specifier] = await loader.resolve(
                  specifier,
                  {},
                  value => ({ url: value }),
                );
              }
              console.log(JSON.stringify(resolved));
            })().catch(error => {
              console.error(error);
              process.exit(1);
            });
          `,
        ],
        {
          cwd: rootDir,
          encoding: 'utf8',
          env: {
            ...process.env,
            TS_NODE_PROJECT: tsconfigPath,
          },
        },
      );

      const resolved = JSON.parse(output.trim());
      expect(
        fs.realpathSync(fileURLToPath(resolved['@service/user'].url)),
      ).toBe(fs.realpathSync(serviceFile));
      expect(
        fs.realpathSync(fileURLToPath(resolved['@service/user.js'].url)),
      ).toBe(fs.realpathSync(serviceFile));
    } finally {
      fs.rmSync(rootDir, { recursive: true, force: true });
    }
  });

  it('should resolve relative imports without extension from within the app directory', async () => {
    const { rootDir, appDir, tsconfigPath } = createTmpApp();
    const entryFile = path.join(appDir, 'index.ts');
    const helperFile = path.join(appDir, 'helper.ts');

    fs.writeFileSync(entryFile, '');
    fs.writeFileSync(helperFile, 'export const helper = 1;\n');

    try {
      const output = childProcess.execFileSync(
        process.execPath,
        [
          '-e',
          `
            const { pathToFileURL } = require('node:url');

            (async () => {
              const loader = await import(
                pathToFileURL(${JSON.stringify(loaderPath)}).href,
              );
              await loader.initialize({
                appDir: ${JSON.stringify(appDir)},
                baseUrl: ${JSON.stringify(appDir)},
                paths: {},
              });
              // Extensionless relative import resolved from a file: parentURL inside
              // the app directory must be resolved to the real .ts path.
              const result = await loader.resolve(
                './helper',
                { parentURL: pathToFileURL(${JSON.stringify(entryFile)}).href },
                value => ({ url: value }),
              );
              console.log(JSON.stringify(result));
            })().catch(error => {
              console.error(error);
              process.exit(1);
            });
          `,
        ],
        {
          cwd: rootDir,
          encoding: 'utf8',
          env: {
            ...process.env,
            TS_NODE_PROJECT: tsconfigPath,
          },
        },
      );

      const result = JSON.parse(output.trim());
      expect(fs.realpathSync(fileURLToPath(result.url))).toBe(
        fs.realpathSync(helperFile),
      );
    } finally {
      fs.rmSync(rootDir, { recursive: true, force: true });
    }
  });

  it('should not crash when parentURL is a non-file URL such as data:', async () => {
    const { rootDir, appDir, tsconfigPath } = createTmpApp();
    const serviceDir = path.join(rootDir, 'service');
    const serviceFile = path.join(serviceDir, 'user.ts');

    fs.mkdirSync(serviceDir, { recursive: true });
    fs.writeFileSync(serviceFile, 'export const user = 1;\n');

    try {
      const output = childProcess.execFileSync(
        process.execPath,
        [
          '-e',
          `
            const { pathToFileURL } = require('node:url');

            (async () => {
              const loader = await import(
                pathToFileURL(${JSON.stringify(loaderPath)}).href,
              );
              await loader.initialize({
                appDir: ${JSON.stringify(appDir)},
                baseUrl: ${JSON.stringify(appDir)},
                paths: {
                  '@service': [${JSON.stringify('../service')}],
                  '@service/*': [${JSON.stringify('../service/*')}],
                },
              });
              // Alias resolution must still work when parentURL is a synthetic non-file
              // URL (e.g. Tailwind v4 data: modules). getParentPath must not crash.
              const result = await loader.resolve(
                '@service/user',
                { parentURL: 'data:text/javascript,export default 1' },
                value => ({ url: value }),
              );
              console.log(JSON.stringify(result));
            })().catch(error => {
              console.error(error);
              process.exit(1);
            });
          `,
        ],
        {
          cwd: rootDir,
          encoding: 'utf8',
          env: {
            ...process.env,
            TS_NODE_PROJECT: tsconfigPath,
          },
        },
      );

      const result = JSON.parse(output.trim());
      expect(fs.realpathSync(fileURLToPath(result.url))).toBe(
        fs.realpathSync(serviceFile),
      );
    } finally {
      fs.rmSync(rootDir, { recursive: true, force: true });
    }
  });

  it('compiles app TypeScript with swc, including syntax type stripping rejects and `.js` specifiers', async () => {
    const { rootDir, appDir } = createTmpApp();
    const entryFile = path.join(appDir, 'entry.ts');
    fs.writeFileSync(
      entryFile,
      [
        "import { suffix } from './helper.js';",
        'enum Color { Red, Blue }',
        'class Service { constructor(private name: string) {} get() { return this.name; } }',
        'export const result: string = `${Color.Blue}-${new Service("svc").get()}-${suffix}`;',
      ].join('\n'),
    );
    // NodeNext-style `./helper.js` must resolve to `helper.ts`.
    fs.writeFileSync(
      path.join(appDir, 'helper.ts'),
      "export const suffix: string = 'ok';\n",
    );

    try {
      const output = childProcess.execFileSync(
        process.execPath,
        [
          '--input-type=module',
          '-e',
          `
            import { register } from 'node:module';
            import { pathToFileURL } from 'node:url';
            register(pathToFileURL(${JSON.stringify(loaderPath)}).href, {
              data: {
                appDir: ${JSON.stringify(appDir)},
                baseUrl: ${JSON.stringify(appDir)},
                paths: {},
                compilerOptions: { target: 'ES2022' },
              },
            });
            const { result } = await import(pathToFileURL(${JSON.stringify(entryFile)}).href);
            console.log(result);
          `,
        ],
        { cwd: rootDir, encoding: 'utf8' },
      );

      expect(output.trim()).toBe('1-svc-ok');
    } finally {
      fs.rmSync(rootDir, { recursive: true, force: true });
    }
  });
});
