import path from 'node:path';
import type { RouteLegacy } from '@modern-js/types/cli';
import * as utils from '@modern-js/utils' with { rstest: 'importActual' };

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

  // The generator used to read each route component's 'use client' directive
  // while walking the tree, so sibling branches appended to the shared errors
  // array in file-read completion order and error_0 / error_1 pointed at
  // different files between runs of the same sources.
  test('assigns route component bindings in a stable order', async () => {
    const srcDirectory = path.join(__dirname, 'fixtures', 'stable-order');
    const internalSrcAlias = '@_modern_js_src';
    const branches = ['a', 'b', 'c', 'd'];
    const buildRoutes = () => [
      {
        path: '/',
        _component: `${internalSrcAlias}/layout`,
        id: 'layout',
        isRoot: true,
        type: 'nested' as const,
        children: branches.map(name => ({
          path: name,
          error: `${internalSrcAlias}/${name}/error`,
          _component: `${internalSrcAlias}/${name}/layout`,
          id: `${name}/layout`,
          type: 'nested' as const,
          children: [
            {
              _component: `${internalSrcAlias}/${name}/page`,
              index: true,
              id: `${name}/page`,
              type: 'nested' as const,
            },
          ],
        })),
      },
    ];

    const orders = new Set<string>();
    for (let i = 0; i < 20; i++) {
      const code = await fileSystemRoutes({
        metaName: 'modern-js',
        routes: buildRoutes(),
        entryName: 'main',
        internalDirectory: '',
        srcDirectory,
        internalSrcAlias,
      });
      orders.add(
        Array.from(
          code.matchAll(/import error_\d+ from '([^']+)'/g),
          match => match[1],
        ).join(','),
      );
    }

    expect(Array.from(orders)).toEqual([
      branches.map(name => `${internalSrcAlias}/${name}/error`).join(','),
    ]);
  });
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
