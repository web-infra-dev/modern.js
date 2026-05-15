import { mkdir, mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import type { Entrypoint } from '@modern-js/types';
import { fs, NESTED_ROUTE_SPEC_FILE } from '@modern-js/utils';
import {
  tanstackRouterPlugin,
  writeTanstackRegisterFile,
  writeTanstackRouterTypesForEntries,
} from '../../src/cli';

const runtimeCliMocks = {
  handleFileChange: rstest.fn(),
  handleGeneratorEntryCode: rstest.fn(),
};

rstest.mock('@modern-js/runtime/cli', () => {
  const routesDirMetaKey = '__modernRoutesDir';

  return {
    __esModule: true,
    getEntrypointRoutesDir: (entrypoint: any) =>
      entrypoint[routesDirMetaKey] ||
      (entrypoint.nestedRoutesEntry
        ? path.basename(entrypoint.nestedRoutesEntry)
        : null),
    handleFileChange: runtimeCliMocks.handleFileChange,
    handleGeneratorEntryCode: runtimeCliMocks.handleGeneratorEntryCode,
    handleModifyEntrypoints: async (
      entrypoints: Entrypoint[],
      routesDir = 'routes',
    ) =>
      entrypoints.map(entrypoint => {
        const routesEntry = path.join(entrypoint.absoluteEntryDir!, routesDir);
        return {
          ...entrypoint,
          nestedRoutesEntry: routesEntry,
          [routesDirMetaKey]: routesDir,
        };
      }),
    isRouteEntry: (dir: string, routesDir = 'routes') => {
      const routesEntry = path.join(dir, routesDir);
      return fs.existsSync(routesEntry) ? routesEntry : false;
    },
  };
});

describe('tanstack router cli plugin', () => {
  let tempDir: string | undefined;

  afterEach(async () => {
    runtimeCliMocks.handleFileChange.mockReset();
    runtimeCliMocks.handleGeneratorEntryCode.mockReset();

    if (tempDir) {
      await rm(tempDir, { recursive: true, force: true });
      tempDir = undefined;
    }
  });

  test('writes plugin-owned router types and register metadata', async () => {
    tempDir = await mkdtemp(path.join(tmpdir(), 'modern-tanstack-cli-'));
    const srcDirectory = path.join(tempDir, 'src');
    await mkdir(srcDirectory, { recursive: true });

    await writeTanstackRouterTypesForEntries({
      appContext: {
        srcDirectory,
        internalSrcAlias: '@/_',
        entrypoints: [
          { entryName: 'dashboard', isMainEntry: false },
          { entryName: 'main', isMainEntry: true },
        ],
      } as any,
      generatedDirName: 'generated-router',
      routesByEntry: {
        dashboard: [],
        main: [],
      },
    });

    const mainRouter = await readFile(
      path.join(srcDirectory, 'generated-router', 'main', 'router.gen.ts'),
      'utf-8',
    );
    expect(mainRouter).toContain(
      "} from '@modern-js/plugin-tanstack/runtime';",
    );

    const register = await readFile(
      path.join(srcDirectory, 'generated-router', 'register.gen.d.ts'),
      'utf-8',
    );
    expect(register).toContain("from './main/router.gen'");
    expect(register.indexOf("from './main/router.gen'")).toBeLessThan(
      register.indexOf("from './dashboard/router.gen'"),
    );
    expect(register).toContain(
      "declare module '@modern-js/plugin-tanstack/runtime'",
    );
  });

  test('can write register metadata without routes for custom entry lists', async () => {
    tempDir = await mkdtemp(path.join(tmpdir(), 'modern-tanstack-cli-'));
    const srcDirectory = path.join(tempDir, 'src');

    await writeTanstackRegisterFile({
      entries: ['main'],
      generatedDirName: 'tanstack',
      srcDirectory,
    });

    const register = await readFile(
      path.join(srcDirectory, 'tanstack', 'register.gen.d.ts'),
      'utf-8',
    );
    expect(register).toContain('router: typeof router0');
    expect(register).toContain(
      "declare module '@modern-js/plugin-tanstack/runtime'",
    );
  });

  test('claims custom routes, injects runtime plugin, and merges route specs', async () => {
    tempDir = await mkdtemp(path.join(tmpdir(), 'modern-tanstack-cli-'));
    const srcDirectory = path.join(tempDir, 'src');
    const distDirectory = path.join(tempDir, 'dist');
    const entryDir = path.join(srcDirectory, 'main');
    const viewsDir = path.join(entryDir, 'views');
    await mkdir(viewsDir, { recursive: true });

    const taps: Record<string, any> = {};
    const api = {
      getAppContext: () => ({
        srcDirectory,
        distDirectory,
        metaName: 'modern-js',
        serverRoutes: [{ entryName: 'main', urlPath: '/dashboard' }],
      }),
      _internalRuntimePlugins: (tap: any) => {
        taps.internalRuntimePlugins = tap;
      },
      checkEntryPoint: (tap: any) => {
        taps.checkEntryPoint = tap;
      },
      config: (tap: any) => {
        taps.config = tap;
      },
      modifyEntrypoints: (tap: any) => {
        taps.modifyEntrypoints = tap;
      },
      generateEntryCode: (tap: any) => {
        taps.generateEntryCode = tap;
      },
      onFileChanged: (tap: any) => {
        taps.onFileChanged = tap;
      },
      modifyFileSystemRoutes: (tap: any) => {
        taps.modifyFileSystemRoutes = tap;
      },
      onBeforeGenerateRoutes: (tap: any) => {
        taps.onBeforeGenerateRoutes = tap;
      },
    };

    tanstackRouterPlugin({ routesDir: 'views' }).setup!(api as any);

    expect(taps.checkEntryPoint({ path: entryDir, entry: false })).toEqual({
      path: entryDir,
      entry: viewsDir,
    });

    const { entrypoints } = await taps.modifyEntrypoints({
      entrypoints: [
        {
          entryName: 'main',
          entry: entryDir,
          absoluteEntryDir: entryDir,
          isAutoMount: true,
          isMainEntry: true,
        } as Entrypoint,
      ],
    });
    const [entrypoint] = entrypoints;
    expect(entrypoint.nestedRoutesEntry).toBe(viewsDir);

    expect(
      taps.internalRuntimePlugins({ entrypoint, plugins: [] }).plugins,
    ).toEqual([
      {
        name: 'tanstackRouter',
        path: '@modern-js/plugin-tanstack/runtime',
        config: { serverBase: ['/dashboard'] },
      },
    ]);

    const specPath = path.join(distDirectory, NESTED_ROUTE_SPEC_FILE);
    await fs.outputJSON(specPath, {
      existing: [{ id: 'keep-me' }],
    });

    await taps.modifyFileSystemRoutes({
      entrypoint,
      routes: [
        {
          id: 'main-route',
          type: 'nested',
          origin: 'file-system',
        },
      ],
    });
    await taps.onBeforeGenerateRoutes({ entrypoint, code: '' });

    expect(await fs.readJSON(specPath)).toEqual({
      existing: [{ id: 'keep-me' }],
      main: [
        {
          id: 'main-route',
          type: 'nested',
          origin: 'file-system',
        },
      ],
    });
  });

  test('generates plugin-owned TanStack route files through core route generation', async () => {
    tempDir = await mkdtemp(path.join(tmpdir(), 'modern-tanstack-cli-'));
    const srcDirectory = path.join(tempDir, 'src');
    const entryDir = path.join(srcDirectory, 'main');
    const viewsDir = path.join(entryDir, 'views');
    await mkdir(path.join(viewsDir, 'mf'), { recursive: true });
    await fs.outputFile(
      path.join(viewsDir, 'mf', 'page.data.ts'),
      [
        'export const loader = () => ({ count: 0 });',
        'export const action = () => Response.json({ count: 1 });',
      ].join('\n'),
    );

    const entrypoint = {
      entryName: 'main',
      entry: entryDir,
      absoluteEntryDir: entryDir,
      isAutoMount: true,
      isMainEntry: true,
      nestedRoutesEntry: viewsDir,
      __modernRoutesDir: 'views',
    } as Entrypoint;
    runtimeCliMocks.handleGeneratorEntryCode.mockResolvedValue({
      main: [
        {
          type: 'nested',
          id: 'layout',
          isRoot: true,
          children: [
            {
              type: 'nested',
              id: 'mf/page',
              path: 'mf',
              data: '@/_/main/views/mf/page.data',
              action: '@/_/main/views/mf/page.data',
            },
          ],
        },
      ],
    });

    const taps: Record<string, any> = {};
    const api = {
      getAppContext: () => ({
        srcDirectory,
        internalSrcAlias: '@/_',
        entrypoints: [entrypoint],
      }),
      _internalRuntimePlugins: () => {},
      checkEntryPoint: (tap: any) => {
        taps.checkEntryPoint = tap;
      },
      config: (tap: any) => {
        taps.config = tap;
      },
      modifyEntrypoints: (tap: any) => {
        taps.modifyEntrypoints = tap;
      },
      generateEntryCode: (tap: any) => {
        taps.generateEntryCode = tap;
      },
      onFileChanged: (tap: any) => {
        taps.onFileChanged = tap;
      },
      modifyFileSystemRoutes: (tap: any) => {
        taps.modifyFileSystemRoutes = tap;
      },
      onBeforeGenerateRoutes: (tap: any) => {
        taps.onBeforeGenerateRoutes = tap;
      },
    };

    tanstackRouterPlugin({
      generatedDirName: 'tanstack-generated',
      routesDir: 'views',
    }).setup!(api as any);

    await taps.generateEntryCode({ entrypoints: [entrypoint] });

    expect(runtimeCliMocks.handleGeneratorEntryCode).toHaveBeenCalledWith(
      api,
      [entrypoint],
      {
        entrypointsKey: '@modern-js/plugin-tanstack',
        generateCodeOptions: {
          enableTanstackTypes: false,
        },
      },
    );

    const routerGen = await readFile(
      path.join(srcDirectory, 'tanstack-generated', 'main', 'router.gen.ts'),
      'utf-8',
    );
    expect(routerGen).toContain("} from '@modern-js/plugin-tanstack/runtime';");
    expect(routerGen).toContain('modernRouteAction: action_0');

    const register = await readFile(
      path.join(srcDirectory, 'tanstack-generated', 'register.gen.d.ts'),
      'utf-8',
    );
    expect(register).toContain(
      "declare module '@modern-js/plugin-tanstack/runtime'",
    );
  });

  test('regenerates plugin-owned TanStack files for scoped file changes', async () => {
    const regenerateEvent = {
      eventType: 'add',
      filename: 'src/main/views/page.tsx',
    };
    const entrypoint = {
      entryName: 'main',
      __modernRoutesDir: 'views',
    } as any as Entrypoint;
    const api = {
      getAppContext: () => ({
        srcDirectory: '/tmp/app/src',
        internalSrcAlias: '@/_',
        entrypoints: [entrypoint],
      }),
      _internalRuntimePlugins: () => {},
      checkEntryPoint: () => {},
      config: () => {},
      modifyEntrypoints: () => {},
      generateEntryCode: () => {},
      onFileChanged: (tap: any) => {
        api.onFileChangedTap = tap;
      },
      modifyFileSystemRoutes: () => {},
      onBeforeGenerateRoutes: () => {},
      onFileChangedTap: undefined as any,
    };

    tanstackRouterPlugin({ routesDir: 'views' }).setup!(api as any);

    runtimeCliMocks.handleFileChange.mockImplementationOnce(
      async (_api, _event, options) => {
        expect(options.entrypointsKey).toBe('@modern-js/plugin-tanstack');
        expect(options.includeEntry(entrypoint)).toBe(true);
        expect(
          options.includeEntry({
            ...entrypoint,
            __modernRoutesDir: 'routes',
          }),
        ).toBe(false);
        expect(typeof options.regenerate).toBe('function');
      },
    );

    await api.onFileChangedTap(regenerateEvent);

    expect(runtimeCliMocks.handleFileChange).toHaveBeenCalledWith(
      api,
      regenerateEvent,
      expect.objectContaining({
        entrypointsKey: '@modern-js/plugin-tanstack',
      }),
    );
  });
});
