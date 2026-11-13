import type { NestedRouteForCli, RouteLegacy } from '@modern-js/types/cli';
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
});

describe('routesForServer', () => {
  test('exports parameter generators only from the SSG server loader module', async () => {
    const routes: NestedRouteForCli[] = [
      {
        id: 'layout',
        type: 'nested',
        origin: 'file-system',
        path: '/',
        children: [
          {
            id: 'blog/(slug)/page',
            type: 'nested',
            origin: 'file-system',
            routeType: 'page',
            path: 'blog/:slug',
            data: '@_modern_js_src/routes/blog/[slug]/page.data',
            ssgParams: '@_modern_js_src/routes/blog/[slug]/page.data',
          },
          {
            id: 'client/(id)/page',
            type: 'nested',
            origin: 'file-system',
            inValidSSRRoute: true,
            path: 'client/:id',
            ssgParams: '@_modern_js_src/routes/client/[id]/page.data',
          },
        ],
      },
    ];

    const serverCode = routesForServer({
      routesForServerLoaderMatches: routes,
      ssg: true,
    });
    expect(serverCode).toContain(
      'import { ssgParams as ssgParams_0 } from "@_modern_js_src/routes/blog/[slug]/page.data";',
    );
    expect(serverCode).toContain(
      'export const ssgParams = {"blog/(slug)/page": ssgParams_0};',
    );
    expect(serverCode).not.toContain('"ssgParams":');
    expect(serverCode).not.toContain('routes/client/[id]/page.data');

    const ssrCode = routesForServer({ routesForServerLoaderMatches: routes });
    expect(ssrCode).not.toContain('ssgParams');

    const clientCode = await fileSystemRoutes({
      metaName: 'modern-js',
      entryName: 'main',
      nestedRoutesEntry: '/src/routes',
      internalDirectory: '',
      ssrMode: 'stream',
      routes,
    });
    expect(clientCode).not.toContain('ssgParams');
    expect(clientCode).toContain('?loaderId=');
  });

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
