import path from 'node:path';
import type {
  NestedRouteForCli,
  PageRoute,
  RouteLegacy,
} from '@modern-js/types/cli';
import * as utils from '@modern-js/utils' with { rstest: 'importActual' };
import { init, parse } from 'es-module-lexer';

import {
  fileSystemRoutes,
  routesForServer,
} from '../../src/router/cli/code/templates';

rstest.mock('@modern-js/utils', () => {
  const fs = {
    writeFile() {},
    writeJSON() {},
    ensureFile() {},
  };
  return {
    __esModule: true,
    ...utils,
    fs,
  };
});

expect.addSnapshotSerializer({
  test: val => typeof val === 'string',
  print: (val: unknown) => (val as string).replace(/\\/g, '/'),
});

describe('fileSystemRoutes', () => {
  test('generate code for legacy router', async () => {
    const routes: RouteLegacy[] = [
      {
        path: '/user',
        exact: true,
        component: '@/pages/user',
        _component: '@/pages/user',
      },
    ];

    const code = await fileSystemRoutes({
      metaName: 'modern-js',
      routes,
      entryName: 'main',
      internalDirectory: '',
    });
    expect(code).toMatchSnapshot();
  });

  test('generate code', async () => {
    const routes = [
      {
        path: '/',
        _component: '@_modern_js_src/routes/layout.tsx',
        id: 'layout',
        type: 'nested' as const,
        children: [
          {
            path: 'user',
            error: '@_modern_js_src/routes/error.tsx',
            _component: '@_modern_js_src/routes/user/layout.tsx',
            loading: '@_modern_js_src/routes/loading.tsx',
            id: 'user/layout',
            type: 'nested' as const,
            loader: '@_modern_js_src/routes/layout.loader.ts',
            children: [
              {
                path: ':id',
                id: 'user/[id]/layout',
                type: 'nested' as const,
                children: [
                  {
                    _component: '@_modern_js_src/routes/user/[id]/page.tsx',
                    index: true,
                    id: 'user/[id]/page',
                    loader: '@_modern_js_src/routes/user/[id]/page.tsx',
                    type: 'nested' as const,
                  },
                ],
              },
            ],
          },
        ],
      },
    ];
    const code = await fileSystemRoutes({
      metaName: 'modern-js',
      entryName: 'main',
      routes,
      internalDirectory: '',
    });
    expect(code).toMatchSnapshot();
  });

  test.each([
    [
      String.raw`D:\app\tests\params-src\routes`,
      'D:/app/tests/params-src/routes',
    ],
    [
      String.raw`D:\中文目录\tests\params-src\routes`,
      'D:/中文目录/tests/params-src/routes',
    ],
  ])(
    'preserves Windows module paths from %s',
    async (directory, importDirectory) => {
      await init;
      const routes: (NestedRouteForCli | PageRoute)[] = [
        {
          type: 'nested',
          origin: 'file-system',
          id: 'layout',
          path: '/',
          isRoot: true,
          _component: path.win32.join(directory, 'layout'),
          loading: path.win32.join(directory, 'loading'),
          error: path.win32.join(directory, 'error'),
          children: [
            {
              type: 'nested',
              origin: 'file-system',
              id: 'page',
              path: 'page',
              _component: path.win32.join(directory, 'page'),
            },
          ],
        },
        {
          type: 'page',
          id: 'page-route',
          path: 'page-route',
          component: path.win32.join(directory, 'page-route'),
          _component: path.win32.join(directory, 'page-route'),
        },
      ];
      const legacyRoutes: RouteLegacy[] = [
        {
          path: '/legacy',
          exact: true,
          component: path.win32.join(directory, 'legacy'),
          _component: path.win32.join(directory, 'legacy'),
        },
      ];

      for (const ssrMode of [undefined, 'string', 'stream'] as const) {
        for (const splitRouteChunks of [true, false]) {
          const options = {
            metaName: 'modern-js',
            entryName: 'main',
            internalDirectory: '',
            ssrMode,
            splitRouteChunks,
          };
          const code = await fileSystemRoutes({ ...options, routes });
          const legacyCode = await fileSystemRoutes({
            ...options,
            routes: legacyRoutes,
          });
          const imports = [...parse(code)[0], ...parse(legacyCode)[0]]
            .map(({ n }) => n)
            .filter(importPath => importPath?.startsWith('D:'));
          expect(
            [...new Set(imports)].sort(),
            `${ssrMode}/${splitRouteChunks}`,
          ).toEqual(
            ['layout', 'loading', 'error', 'page', 'page-route', 'legacy']
              .map(filename => `${importDirectory}/${filename}`)
              .sort(),
          );
        }
      }
    },
  );
});

describe('routesForServer', () => {
  test('generate code for server', async () => {
    const routesForServerLoaderMatches = [
      {
        path: '/',
        _component: '@_modern_js_src/routes/layout.tsx',
        id: 'layout',
        type: 'nested' as const,
        children: [
          {
            path: 'user',
            error: '@_modern_js_src/routes/error.tsx',
            _component: '@_modern_js_src/routes/user/layout.tsx',
            loading: '@_modern_js_src/routes/loading.tsx',
            id: 'user/layout',
            type: 'nested' as const,
            loader: '@_modern_js_src/routes/layout.loader.ts',
            children: [
              {
                path: ':id',
                id: 'user/[id]/layout',
                type: 'nested' as const,
                children: [
                  {
                    _component: '@_modern_js_src/routes/user/[id]/page.tsx',
                    index: true,
                    id: 'user/[id]/page',
                    loader: '@_modern_js_src/routes/user/[id]/page.loader.ts',
                    type: 'nested' as const,
                  },
                ],
              },
            ],
          },
        ],
      },
    ];
    const code = routesForServer({
      routesForServerLoaderMatches,
    });
    expect(code).toMatchSnapshot();
  });
});
