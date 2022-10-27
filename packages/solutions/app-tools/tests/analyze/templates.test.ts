import { fileSystemRoutes } from '../../src/analyze/templates';

describe('fileSystemRoutes', () => {
  test('generate code for legacy router', async () => {
    const routes = [
      {
        path: '/user',
        exact: true,
        component: '@/pages/user',
        _component: '@/pages/user',
      },
    ];

    const code = fileSystemRoutes({ routes });
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
                    type: 'nested' as const,
                  },
                ],
              },
            ],
          },
        ],
      },
    ];
    const code = fileSystemRoutes({ routes });
    expect(code).toMatchSnapshot();
  });
});
