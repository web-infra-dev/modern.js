// eslint-disable-next-line eslint-comments/disable-enable-pair
/* eslint-disable @typescript-eslint/no-empty-function */
import { RouteLegacy } from '@modern-js/types/cli';
import { fileSystemRoutes, renderFunction } from '../../src/analyze/templates';

jest.mock('@modern-js/utils', () => {
  const fs = {
    writeFile() {},
    writeJSON() {},
    ensureFile() {},
  };
  return {
    __esModule: true,
    ...jest.requireActual('@modern-js/utils'),
    fs,
  };
});

expect.addSnapshotSerializer({
  test: val => typeof val === 'string',
  print: (val: string) => val.replace(/\\/g, '/'),
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
      routes,
      ssrMode: false,
      entryName: 'main',
      internalDirectory: '',
      internalDirAlias: '@_modern_js_internal',
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
            _component: '@_modern_js_src/routes/user.tsx',
            loading: '@_modern_js_src/routes/loading.tsx',
            id: 'user/layout',
            type: 'nested' as const,
            loader: '@_modern_js_src/routes/user.tsx',
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
      entryName: 'main',
      routes,
      ssrMode: false,
      internalDirectory: '',
      internalDirAlias: '@_modern_js_internal',
    });
    expect(code).toMatchSnapshot();
  });
});

describe('renderFunction', () => {
  test('basic usage', () => {
    const code = renderFunction({
      plugins: [],
      customBootstrap: false,
      fileSystemRoutes: undefined,
    });

    expect(code).toMatchSnapshot();
  });
});
