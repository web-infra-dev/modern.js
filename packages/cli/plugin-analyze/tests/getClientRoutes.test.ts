import path from 'path';
import fs from 'fs-extra';
import type { IAppContext, NormalizedConfig } from '@modern-js/core';
import { getBundleEntry } from '../src/getBundleEntry';
import { getClientRoutes } from '../src/getClientRoutes';

describe.only('get client routes', () => {
  const fixturePath = path.resolve(
    __dirname,
    './fixtures/entries/file-system-routes',
  );
  const appContext = {
    appDirectory: fixturePath,
    srcDirectory: path.join(fixturePath, 'src'),
    internalDirectory: path.resolve(fixturePath, './node_modules/.modern-js'),
    internalDirAlias: '@_modern_js_internal',
    internalSrcAlias: '@_modern_js_src',
  };

  const config = { source: { entriesDir: './src' } };

  fs.copySync(
    path.join(fixturePath, '_node_modules'),
    path.join(fixturePath, 'node_modules'),
  );

  test('basic usage', () => {
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
        component: '__modern_js_src_pages_index_ts',
        exact: true,
        parent: undefined,
      },
      {
        path: '/a/b',
        _component:
          '@_modern_js_internal/main/internal_components/Comp___modern_js_src_pages_a_b_index_ts___modern_js_src_pages_a_b__layout_ts___modern_js_src_pages_a__layout_ts.jsx',
        component:
          'Comp___modern_js_src_pages_a_b_index_ts___modern_js_src_pages_a_b__layout_ts___modern_js_src_pages_a__layout_ts',
        exact: true,
        parent: undefined,
      },
      {
        path: '/a/b/info',
        _component:
          '@_modern_js_internal/main/internal_components/Comp___modern_js_src_pages_a_b_info_ts___modern_js_src_pages_a_b__layout_ts___modern_js_src_pages_a__layout_ts.jsx',
        component:
          'Comp___modern_js_src_pages_a_b_info_ts___modern_js_src_pages_a_b__layout_ts___modern_js_src_pages_a__layout_ts',
        exact: true,
        parent: undefined,
      },
      {
        path: '/a/b/about',
        _component:
          '@_modern_js_internal/main/internal_components/Comp___modern_js_src_pages_a_b_about_ts___modern_js_src_pages_a_b__layout_ts___modern_js_src_pages_a__layout_ts.jsx',
        component:
          'Comp___modern_js_src_pages_a_b_about_ts___modern_js_src_pages_a_b__layout_ts___modern_js_src_pages_a__layout_ts',
        exact: true,
        parent: undefined,
      },
    ]);
  });
});
