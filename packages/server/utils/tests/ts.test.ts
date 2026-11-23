import os from 'os';
import path from 'path';
import { fs, logger } from '@modern-js/utils';
import { compile } from '../src';

// A project whose `typescript` is a stand-in: `tsc` records the config it was
// given and exits with `exitCode`. The package has no JS entry, like TS 7.
const createStubTypeScriptApp = async (version: string, exitCode = 0) => {
  const appDir = await fs.mkdtemp(path.join(os.tmpdir(), 'server-utils-ts-'));
  await fs.outputFile(
    path.join(appDir, 'api/index.ts'),
    "export default (): string => 'api';\n",
  );
  await fs.outputJSON(path.join(appDir, 'tsconfig.json'), {
    compilerOptions: { target: 'ES2022', baseUrl: './' },
  });
  const tsDir = path.join(appDir, 'node_modules/typescript');
  await fs.outputJSON(path.join(tsDir, 'package.json'), {
    name: 'typescript',
    version,
    bin: { tsc: './bin/tsc' },
  });
  await fs.outputFile(
    path.join(tsDir, 'bin/tsc'),
    [
      "const fs = require('fs');",
      "const project = process.argv[process.argv.indexOf('-p') + 1];",
      "fs.writeFileSync(require('path').join(__dirname, 'last-config.json'), fs.readFileSync(project));",
      exitCode ? "console.log('api/index.ts(1,1): error TS2322: stub');" : '',
      `process.exit(${exitCode});`,
    ].join('\n'),
  );
  const lastConfig = () =>
    fs.readJSON(path.join(tsDir, 'bin/last-config.json'));
  return { appDir, lastConfig };
};

describe('server compile', () => {
  it('compile typescript', async () => {
    const example = path.join(__dirname, './fixtures', './ts-example');
    // tsconfig.json is bundler-mode (ESNext); the convention file layers the
    // `@modern-js/tsconfig/server` preset on top of it for commonjs output.
    const tsconfigPath = path.join(example, './tsconfig.server.json');
    const distDir = path.join(example, './dist');
    const sharedDir = path.join(example, './shared');
    const apiDir = path.join(example, './api');
    const serverDir = path.join(example, './server');

    try {
      await compile(
        example,
        {
          alias: {
            '@modern-js/runtime/server': path.join(
              sharedDir,
              './runtime/server',
            ),
          },
        } as any,
        {
          sourceDirs: [sharedDir, apiDir, serverDir],
          distDir,
          tsconfigPath,
        },
      );
    } catch (error) {
      console.error('compile error', error);
    }

    const distApiDir = path.join(example, './dist', './api');

    const api = require(distApiDir).default;
    expect(api()).toEqual('runtime-shared-api');

    const distServerDir = path.join(distDir, './server');
    const server = require(distServerDir).default;
    expect(server()).toEqual('shared-server');

    const files = await fs.readdir(distServerDir);
    expect(files.length).toBe(2);

    const distSrcDir = path.join(distDir, './src');
    expect(await fs.pathExists(distSrcDir)).toBeFalsy();

    const mapAliasFile = path.join(distApiDir, './map-alias.js');
    expect(await fs.pathExists(mapAliasFile)).toBeTruthy();
    // ignore
    // const mapAliasContent = (await fs.readFile(mapAliasFile)).toString();
    // expect(mapAliasContent).toMatchSnapshot();

    await fs.remove(distDir);
  });

  it('emits commonjs from a bundler-mode tsconfig without a warning', async () => {
    const example = path.join(__dirname, './fixtures', './ts-example');
    // The main tsconfig resolves to `module: ESNext`; the framework passes the
    // NodeNext overrides when it falls back to it in a commonjs project.
    const tsconfigPath = path.join(example, './tsconfig.json');
    const distDir = path.join(example, './dist-fallback');
    const sharedDir = path.join(example, './shared');
    const apiDir = path.join(example, './api');
    const serverDir = path.join(example, './server');
    const warn = rstest.spyOn(logger, 'warn').mockImplementation(() => {});

    const run = () =>
      compile(
        example,
        {
          alias: {
            '@modern-js/runtime/server': path.join(
              sharedDir,
              './runtime/server',
            ),
          },
        } as any,
        {
          sourceDirs: [sharedDir, apiDir, serverDir],
          distDir,
          tsconfigPath,
          moduleType: 'commonjs',
          compilerOverrides: {
            module: 'NodeNext',
            moduleResolution: 'NodeNext',
          },
        },
      );

    try {
      await run();

      const apiContent = (
        await fs.readFile(path.join(distDir, './api/index.js'))
      ).toString();
      expect(apiContent).toMatch(/\bexports\b/);
      expect(apiContent).toContain('require(');
      expect(apiContent).not.toMatch(/^import /m);
      // aliases are rewritten to relative specifiers
      expect(apiContent).toContain('../shared/index');
      expect(apiContent).not.toContain('@shared/');

      const api = require(path.join(distDir, './api')).default;
      expect(api()).toEqual('runtime-shared-api');

      const server = require(path.join(distDir, './server')).default;
      expect(server()).toEqual('shared-server');

      // The output format follows package.json#type, so the fallback no
      // longer changes what is emitted and is not reported.
      expect(warn).not.toBeCalled();
    } finally {
      warn.mockRestore();
      await fs.remove(distDir);
    }
  });

  it('compiles without the TypeScript JS API and type-checks with the project tsc', async () => {
    const { appDir, lastConfig } = await createStubTypeScriptApp('7.0.2');
    try {
      await compile(appDir, { alias: {} } as any, {
        sourceDirs: [path.join(appDir, 'api')],
        distDir: path.join(appDir, 'dist'),
        tsconfigPath: path.join(appDir, 'tsconfig.json'),
        compilerOverrides: { module: 'NodeNext', moduleResolution: 'NodeNext' },
      });

      const api = require(path.join(appDir, 'dist/api')).default;
      expect(api()).toBe('api');

      const config = await lastConfig();
      expect(config.extends).toBe(path.join(appDir, 'tsconfig.json'));
      expect(config.compilerOptions).toMatchObject({
        module: 'NodeNext',
        moduleResolution: 'NodeNext',
        noEmit: true,
      });
      expect(config.compilerOptions.ignoreDeprecations).toBeUndefined();
      expect(config.include).toEqual([path.join(appDir, 'api/**/*')]);
    } finally {
      await fs.remove(appDir);
    }
  });

  it('ignores the TypeScript 6 deprecations such as TS5101 in the type check', async () => {
    const { appDir, lastConfig } = await createStubTypeScriptApp('6.0.3');
    try {
      await compile(appDir, { alias: {} } as any, {
        sourceDirs: [path.join(appDir, 'api')],
        distDir: path.join(appDir, 'dist'),
        tsconfigPath: path.join(appDir, 'tsconfig.json'),
      });

      expect((await lastConfig()).compilerOptions.ignoreDeprecations).toBe(
        '6.0',
      );
    } finally {
      await fs.remove(appDir);
    }
  });

  it('fails the build when the type check reports errors', async () => {
    const { appDir } = await createStubTypeScriptApp('5.9.3', 2);
    const exit = rstest.spyOn(process, 'exit').mockImplementation((() => {
      throw new Error('process.exit');
    }) as any);
    const error = rstest.spyOn(logger, 'error').mockImplementation(() => {});
    try {
      await expect(
        compile(appDir, { alias: {} } as any, {
          sourceDirs: [path.join(appDir, 'api')],
          distDir: path.join(appDir, 'dist'),
          tsconfigPath: path.join(appDir, 'tsconfig.json'),
        }),
      ).rejects.toThrow('process.exit');
      expect(error.mock.calls[0][0]).toContain('TS2322');
    } finally {
      exit.mockRestore();
      error.mockRestore();
      await fs.remove(appDir);
    }
  });

  it('rejects unknown compilerOverrides values', async () => {
    const example = path.join(__dirname, './fixtures', './ts-example');
    const distDir = path.join(example, './dist-invalid');

    await expect(
      compile(example, { alias: {} } as any, {
        sourceDirs: [path.join(example, './shared')],
        distDir,
        tsconfigPath: path.join(example, './tsconfig.json'),
        compilerOverrides: { module: 'not-a-module-kind' },
      }),
    ).rejects.toThrow('compilerOverrides.module');

    await fs.remove(distDir);
  });

  it('emits even when the tsconfig is type-check only', async () => {
    const example = path.join(__dirname, './fixtures', './ts-example');
    // `noEmit: true` + `emitDeclarationOnly: true` come from the main
    // project config; the server compile must ignore both.
    const tsconfigPath = path.join(example, './tsconfig.noemit.json');
    const distDir = path.join(example, './dist-noemit');
    const sharedDir = path.join(example, './shared');
    const serverDir = path.join(example, './server');

    try {
      await compile(example, { alias: {} } as any, {
        sourceDirs: [sharedDir, serverDir],
        distDir,
        tsconfigPath,
      });

      expect(
        await fs.pathExists(path.join(distDir, './server/index.js')),
      ).toBeTruthy();
      const server = require(path.join(distDir, './server')).default;
      expect(server()).toEqual('shared-server');
    } finally {
      await fs.remove(distDir);
    }
  });

  it('rewrites tsconfig path aliases in emitted declarations', async () => {
    const example = path.join(__dirname, './fixtures', './ts-declaration');
    const tsconfigPath = path.join(example, './tsconfig.json');
    const distDir = path.join(example, './dist');
    const sharedDir = path.join(example, './shared');
    const apiDir = path.join(example, './api');

    try {
      // tsc never resolves `paths` in `.d.ts` output, so the alias must be
      // rewritten by our `afterDeclarations` transformer.
      await compile(example, { alias: {} } as any, {
        sourceDirs: [sharedDir, apiDir],
        distDir,
        tsconfigPath,
      });

      const dts = (
        await fs.readFile(path.join(distDir, './api/declaration.d.ts'))
      ).toString();

      // No alias may leak to consumers.
      expect(dts).not.toContain('@shared/types');

      // Every specifier kind is rebased to a relative, extensionless path.
      // ImportDeclaration / ExportDeclaration
      expect(dts).toMatch(/from ["']\.\.\/shared\/types["']/);
      // ImportTypeNode (inline `import("...")` type)
      expect(dts).toContain('import("../shared/types")');
      // ImportEqualsDeclaration (`import x = require("...")`)
      expect(dts).toContain('require("../shared/types")');
    } finally {
      await fs.remove(distDir);
    }
  });

  it('appends .js to declaration specifiers in esm output', async () => {
    const example = path.join(__dirname, './fixtures', './ts-declaration-esm');
    const tsconfigPath = path.join(example, './tsconfig.json');
    const distDir = path.join(example, './dist');
    const sharedDir = path.join(example, './shared');
    const apiDir = path.join(example, './api');

    try {
      await compile(example, { alias: {} } as any, {
        sourceDirs: [sharedDir, apiDir],
        distDir,
        tsconfigPath,
        moduleType: 'module',
      });

      const dts = (
        await fs.readFile(path.join(distDir, './api/index.d.ts'))
      ).toString();

      // In ESM output the declaration specifier must carry the emitted `.js`
      // extension just like the JS output, or `node16`/`nodenext` consumers
      // fail with TS2835. TS resolves `./x.js` back to `./x.d.ts`.
      expect(dts).not.toContain('@shared');
      expect(dts).toContain('from "../shared/types.js"');
      expect(dts).toContain('import("../shared/types.js")');
    } finally {
      await fs.remove(distDir);
    }
  });

  it('should keep .js suffix for aliased imports in esm output', async () => {
    const example = path.join(__dirname, './fixtures', './ts-example');
    const tsconfigPath = path.join(example, './tsconfig.esm.json');
    const distDir = path.join(example, './dist-esm');
    const sharedDir = path.join(example, './shared');
    const apiDir = path.join(example, './api');
    const serverDir = path.join(example, './server');

    try {
      await compile(
        example,
        {
          alias: {
            '@modern-js/runtime/server': path.join(
              sharedDir,
              './runtime/server',
            ),
          },
        } as any,
        {
          sourceDirs: [sharedDir, apiDir, serverDir],
          distDir,
          tsconfigPath,
          moduleType: 'module',
        },
      );

      const apiContent = await fs.readFile(
        path.join(distDir, './api/index.js'),
      );
      const jsAliasContent = await fs.readFile(
        path.join(distDir, './api/js-alias.js'),
      );
      const relativeContent = await fs.readFile(
        path.join(distDir, './api/relative.js'),
      );

      expect(apiContent.toString()).toContain(`from "../shared/index.js"`);
      expect(jsAliasContent.toString()).toContain(`from "../shared/index.js"`);
      expect(relativeContent.toString()).toContain(`from "../shared/index.js"`);
    } finally {
      await fs.remove(distDir);
    }
  });

  it('should resolve tsx directory entries and emit runnable js in esm output', async () => {
    const example = path.join(__dirname, './fixtures', './tsx-example');
    const tsconfigPath = path.join(example, './tsconfig.esm.json');
    const distDir = path.join(example, './dist-esm');
    const sharedDir = path.join(example, './shared');
    const serverDir = path.join(example, './server');

    try {
      // No alias and no tsconfig `paths`: relative specifiers still have to be
      // rewritten for native ESM.
      await compile(example, { alias: {} } as any, {
        sourceDirs: [sharedDir, serverDir],
        distDir,
        tsconfigPath,
        moduleType: 'module',
      });

      const serverContent = (
        await fs.readFile(path.join(distDir, './server/index.js'))
      ).toString();

      // `./foo` points at `foo/index.tsx`, so it must not become `./foo.js`.
      expect(serverContent).toContain(`from "./foo/index.js"`);
      expect(serverContent).toContain(`from "../shared/bar.js"`);

      // `jsx: preserve` would emit `foo/index.jsx`, which Node cannot load.
      expect(
        await fs.pathExists(path.join(distDir, './server/foo/index.js')),
      ).toBeTruthy();
      expect(
        await fs.pathExists(path.join(distDir, './server/foo/index.jsx')),
      ).toBeFalsy();

      // Source files must not be copied next to their compiled output.
      expect(
        await fs.pathExists(path.join(distDir, './server/foo/index.tsx')),
      ).toBeFalsy();
    } finally {
      await fs.remove(distDir);
    }
  });

  it('should keep specifiers that are not compiled to js in esm output', async () => {
    const example = path.join(__dirname, './fixtures', './tsx-example');
    const tsconfigPath = path.join(example, './tsconfig.esm.json');
    const distDir = path.join(example, './dist-esm-assets');
    const sharedDir = path.join(example, './shared');
    const serverDir = path.join(example, './server');

    try {
      await compile(example, { alias: {} } as any, {
        sourceDirs: [sharedDir, serverDir],
        distDir,
        tsconfigPath,
        moduleType: 'module',
      });

      const serverContent = (
        await fs.readFile(path.join(distDir, './server/index.js'))
      ).toString();

      // `.json` and `.mjs` are copied verbatim, so their extensions must stay.
      expect(serverContent).toContain(`"../shared/data.json"`);
      expect(serverContent).not.toContain(`../shared/data.js"`);
      expect(serverContent).toContain(`"./helper.mjs"`);
      expect(serverContent).not.toContain(`"./helper.js"`);

      // Import attributes must survive the specifier rewrite.
      expect(serverContent).toMatch(/type:\s*['"]json['"]/);

      // The options argument of a dynamic import must not be dropped.
      expect(serverContent).toMatch(
        /import\(\s*"\.\.\/shared\/data\.json"\s*,\s*\{/,
      );

      expect(serverContent).toContain(`"./legacy.cjs"`);

      // Non-literal specifiers are resolved at runtime and must be untouched.
      expect(serverContent).toContain('import(`./locales/${lang}.js`)');
      expect(serverContent).toContain(`import('./locales/' + lang + '.js')`);

      expect(
        await fs.pathExists(path.join(distDir, './shared/data.json')),
      ).toBeTruthy();
      expect(
        await fs.pathExists(path.join(distDir, './server/helper.mjs')),
      ).toBeTruthy();
      expect(
        await fs.pathExists(path.join(distDir, './server/legacy.cjs')),
      ).toBeTruthy();
    } finally {
      await fs.remove(distDir);
    }
  });
});
