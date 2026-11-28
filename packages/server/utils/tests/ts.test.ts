import path from 'path';
import { fs } from '@modern-js/utils';
import { compile } from '../src';

describe('typescript', () => {
  it('compile typescript', async () => {
    const example = path.join(__dirname, './fixtures', './ts-example');
    const tsconfigPath = path.join(example, './tsconfig.json');
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

// A frontend tsconfig often only type-checks: `noEmit` or `emitDeclarationOnly`,
// `module: esnext` for a bundler, and an `include` that leaves `server/` out. The
// server build must still emit runnable JavaScript for the required entries.
describe('server entries', () => {
  const tmpRoot = path.join(__dirname, '.server-entries-tmp');

  const createApp = async (
    name: string,
    {
      compilerOptions = {},
      include = ['src', 'server', 'shared'],
      files = {},
    }: {
      compilerOptions?: Record<string, unknown>;
      include?: string[];
      files?: Record<string, string>;
    } = {},
  ) => {
    const appDirectory = path.join(tmpRoot, name);
    await fs.remove(appDirectory);
    await fs.outputJson(path.join(appDirectory, 'tsconfig.json'), {
      compilerOptions: {
        target: 'ES2020',
        module: 'CommonJS',
        moduleResolution: 'node',
        strict: true,
        skipLibCheck: true,
        ...compilerOptions,
      },
      include,
    });
    for (const [file, content] of Object.entries({
      'src/index.ts': 'export const page = 1;\n',
      'shared/marker.ts': "export const marker = 'SHARED_MARKER';\n",
      'server/modern.server.ts':
        "import { marker } from '../shared/marker';\nexport default { marker };\n",
      ...files,
    })) {
      await fs.outputFile(path.join(appDirectory, file), content);
    }
    return appDirectory;
  };

  const compileServer = (
    appDirectory: string,
    {
      entries = ['server/modern.server.ts'],
      distDir = path.join(appDirectory, 'dist'),
    }: { entries?: string[]; distDir?: string } = {},
  ) =>
    compile(appDirectory, { alias: {} } as any, {
      sourceDirs: [
        path.join(appDirectory, 'server'),
        path.join(appDirectory, 'shared'),
      ],
      distDir,
      tsconfigPath: path.join(appDirectory, 'tsconfig.json'),
      moduleType: 'commonjs',
      throwErrorInsteadOfExit: true,
      entries: entries.map(entry => path.join(appDirectory, entry)),
    });

  const loadOutput = (file: string) => {
    delete require.cache[file];
    return require(file);
  };

  afterAll(async () => {
    await fs.remove(tmpRoot);
  });

  it('emits runnable CommonJS for entries a type-check-only tsconfig leaves out, on every build', async () => {
    const app = await createApp('type-check-only', {
      compilerOptions: {
        noEmit: true,
        module: 'esnext',
        incremental: true,
        tsBuildInfoFile: './node_modules/.cache/tsconfig.tsbuildinfo',
      },
      include: ['src'],
      files: { 'server/cache.ts': "export const cache = 'CACHE';\n" },
    });
    const distDir = path.join(app, 'build/output');

    // The second build starts from a cleaned output directory, as `modern build` does.
    for (const _ of [1, 2]) {
      await fs.remove(distDir);
      await compileServer(app, {
        entries: ['server/modern.server.ts', 'server/cache.ts'],
        distDir,
      });

      expect(
        loadOutput(path.join(distDir, 'server/modern.server.js')).default,
      ).toEqual({ marker: 'SHARED_MARKER' });
      expect(loadOutput(path.join(distDir, 'server/cache.js')).cache).toBe(
        'CACHE',
      );
    }
  });

  it('emits JavaScript when the tsconfig sets emitDeclarationOnly', async () => {
    const app = await createApp('declaration-only', {
      compilerOptions: { declaration: true, emitDeclarationOnly: true },
    });

    await compileServer(app);

    expect(
      loadOutput(path.join(app, 'dist/server/modern.server.js')).default,
    ).toEqual({ marker: 'SHARED_MARKER' });
  });

  it('compiles a JavaScript entry when the tsconfig does not enable allowJs', async () => {
    const app = await createApp('js-entry', {
      compilerOptions: { noEmit: true },
      files: {
        'server/modern.server.js':
          "const { marker } = require('../shared/marker');\nexports.default = { marker };\n",
      },
    });
    await fs.remove(path.join(app, 'server/modern.server.ts'));

    await compileServer(app, { entries: ['server/modern.server.js'] });

    expect(
      loadOutput(path.join(app, 'dist/server/modern.server.js')).default,
    ).toEqual({ marker: 'SHARED_MARKER' });
  });

  it('compiles a Vite-style bundler tsconfig and rewrites its .ts import specifiers', async () => {
    const app = await createApp('ts-extensions', {
      compilerOptions: {
        noEmit: true,
        module: 'esnext',
        moduleResolution: 'bundler',
        allowImportingTsExtensions: true,
        verbatimModuleSyntax: true,
        isolatedModules: true,
        customConditions: ['development'],
      },
      files: {
        'server/modern.server.ts':
          "import { marker } from '../shared/marker.ts';\nexport default { marker };\n",
      },
    });

    await compileServer(app);

    expect(
      loadOutput(path.join(app, 'dist/server/modern.server.js')).default,
    ).toEqual({ marker: 'SHARED_MARKER' });
  });

  it('fails instead of reporting success when a required entry is not emitted', async () => {
    const app = await createApp('emit-skipped', {
      compilerOptions: { noEmit: true, noEmitOnError: true },
      files: {
        'server/modern.server.ts':
          'const value: number = "not a number";\nexport default value;\n',
      },
    });

    await expect(compileServer(app)).rejects.toThrow('server/modern.server.ts');
  });
});
