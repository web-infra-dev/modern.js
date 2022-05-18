import path from 'path';
import type { IAppContext, NormalizedConfig } from '@modern-js/core';
import { getBundleEntry } from '../src/getBundleEntry';
import { getClientRoutes } from '../src/getClientRoutes';

const prepareEnv = (fixturePath: string) => {
  const appContext = {
    appDirectory: fixturePath,
    srcDirectory: path.join(fixturePath, 'src'),
    internalDirectory: path.resolve(fixturePath, './node_modules/.modern-js'),
    internalDirAlias: '@_modern_js_internal',
    internalSrcAlias: '@_modern_js_src',
  };

  const config = { source: { entriesDir: './src' } };

  return {
    appContext,
    config,
  };
};

describe('get client routes', () => {
  test('basic usage', () => {
    const fixturePath = path.resolve(
      __dirname,
      './fixtures/entries/file-system-routes',
    );

    const { appContext, config } = prepareEnv(fixturePath);

    const entries = getBundleEntry(
      appContext as IAppContext,
      config as NormalizedConfig,
    );

    let routes;

    for (const entrypoint of entries) {
      routes = getClientRoutes({
        entrypoint,
        srcDirectory: appContext.srcDirectory,
        srcAlias: appContext.internalSrcAlias,
        internalDirectory: appContext.internalDirectory,
        internalDirAlias: appContext.internalDirAlias,
      });
    }

    expect(routes).toEqual([
      {
        path: '/',
        _component: '@_modern_js_src/pages/index.ts',
        component: 'Comp_pages_index_ts',
        exact: true,
        parent: undefined,
      },
      {
        path: '/info',
        _component: '@_modern_js_src/pages/info.ts',
        component: 'Comp_pages_info_ts',
        exact: true,
        parent: undefined,
      },
      {
        path: '/about',
        _component: '@_modern_js_src/pages/about.ts',
        component: 'Comp_pages_about_ts',
        exact: true,
        parent: undefined,
      },
    ]);
  });

  test('nested routes with `_app.tsx` and `_layout.tsx`', () => {
    const fixturePath = path.resolve(
      __dirname,
      './fixtures/entries/file-system-routes-nested',
    );

    const { appContext, config } = prepareEnv(fixturePath);

    const entries = getBundleEntry(
      appContext as IAppContext,
      config as NormalizedConfig,
    );

    let routes;

    for (const entrypoint of entries) {
      routes = getClientRoutes({
        entrypoint,
        srcDirectory: appContext.srcDirectory,
        srcAlias: appContext.internalSrcAlias,
        internalDirectory: appContext.internalDirectory,
        internalDirAlias: appContext.internalDirAlias,
      });
    }

    expect(routes).toEqual([
      {
        path: '/',
        _component: '@_modern_js_src/pages/index.ts',
        component: 'Comp_pages_index_ts',
        exact: true,
        parent: undefined,
      },
      {
        path: '/a',
        _component:
          '@_modern_js_internal/main/internal_components/L_a_Comp_pages_a_index_ts.jsx',
        component: 'L_a_Comp_pages_a_index_ts',
        exact: true,
        parent: undefined,
      },
      {
        path: '/a/list',
        _component:
          '@_modern_js_internal/main/internal_components/L_a_Comp_pages_a_list_index_ts.jsx',
        component: 'L_a_Comp_pages_a_list_index_ts',
        exact: true,
        parent: undefined,
      },
      {
        path: '/a/about',
        _component:
          '@_modern_js_internal/main/internal_components/L_a_Comp_pages_a_about_index_ts.jsx',
        component: 'L_a_Comp_pages_a_about_index_ts',
        exact: true,
        parent: undefined,
      },
      {
        path: '/a/list/:id',
        _component:
          '@_modern_js_internal/main/internal_components/L_a_Comp_pages_a_list__id__index_ts.jsx',
        component: 'L_a_Comp_pages_a_list__id__index_ts',
        exact: true,
        parent: undefined,
      },
    ]);
  });
});
