import { HTML_CHUNKSMAP_SEPARATOR } from '@modern-js/utils/universal/constants';
import { getAssetsTags, injectAssetsTags } from '../src/runtime/assets/assets';

describe('assets', () => {
  describe('getAssetsTags', () => {
    it('should return correct asset tags', () => {
      const html = `
      <!DOCTYPE html>
      <html>
      <head>
      </head>
      <body>
        <div id="root"><!--<?- html ?>--></div>
        <!--<?- chunksMap.js ?>-->
        <!--<?- SSRDataScript ?>-->
      </body>
      </html>
      `;

      const nestedRoutes = {
        four: [
          {
            path: '/',
            children: [
              {
                _component: '@_modern_js_src/four/routes/$',
                path: '*',
                id: 'four_$',
                type: 'nested',
              },
              {
                path: 'user',
                children: [
                  {
                    _component: '@_modern_js_src/four/routes/user/profile/page',
                    id: 'four_user/profile/page',
                    type: 'nested',
                    data: '@_modern_js_src/four/routes/user/profile/page.data',
                    action:
                      '@_modern_js_src/four/routes/user/profile/page.data',
                    path: 'profile',
                  },
                ],
                isRoot: false,
                loader: '@_modern_js_src/four/routes/user/layout.loader',
                _component: '@_modern_js_src/four/routes/user/layout',
                id: 'four_user/layout',
                type: 'nested',
              },
            ],
            isRoot: true,
            loader: '@_modern_js_src/four/routes/layout.loader',
            _component: '@_modern_js_src/four/routes/layout',
            id: 'four_layout',
            type: 'nested',
          },
        ],
      };

      const routesJson = {
        routes: [
          {
            urlPath: '/four',
            entryName: 'four',
            entryPath: 'html/four/index.html',
            isSPA: true,
            isStream: false,
            isSSR: false,
          },
        ],
      };
      const routesManifest = {
        routeAssets: {
          four: {
            chunkIds: [
              'builder-runtime',
              'lib-react',
              'lib-router',
              'vendors-node_modules_pnpm_pmmmwh_react-refresh-webpack-plugin_0_5_10_react-refresh_0_14_0_web-41db71',
              'vendors-node_modules_pnpm_loadable_component_5_15_3_react_18_2_0_node_modules_loadable_compon-8f0404',
              'packages_runtime_plugin-runtime_dist_esm_core_compatible_js-data_text_javascript_window___ass-337bc1',
              'packages_runtime_plugin-runtime_dist_esm_router_runtime_index_js-packages_runtime_plugin-runt-1b02a2',
              'four',
            ],
            assets: [
              '/static/js/builder-runtime.js',
              '/builder-runtime.98625eacfdd7474c.hot-update.js',
              '/static/js/lib-react.js',
              '/static/js/lib-router.js',
              '/static/js/vendors-node_modules_pnpm_pmmmwh_react-refresh-webpack-plugin_0_5_10_react-refresh_0_14_0_web-41db71.js',
              '/static/js/vendors-node_modules_pnpm_loadable_component_5_15_3_react_18_2_0_node_modules_loadable_compon-8f0404.js',
              '/static/js/packages_runtime_plugin-runtime_dist_esm_core_compatible_js-data_text_javascript_window___ass-337bc1.js',
              '/static/js/packages_runtime_plugin-runtime_dist_esm_router_runtime_index_js-packages_runtime_plugin-runt-1b02a2.js',
              '/packages_runtime_plugin-runtime_dist_esm_router_runtime_index_js-packages_runtime_plugin-runt-1b02a2.98625eacfdd7474c.hot-update.js',
              '/static/js/four.js',
            ],
            referenceCssAssets: [],
          },
          four_$: {
            chunkIds: ['four_$'],
            assets: ['/static/js/async/four_$.js'],
            referenceCssAssets: [],
          },
          'four_user/profile/page': {
            chunkIds: ['four_user/profile/page'],
            assets: [
              '/static/js/async/four_user/profile/page.js',
              '/static/css/async/four_user/profile/page.css',
            ],
            referenceCssAssets: [],
          },
          'four_user/layout': {
            chunkIds: ['four_user/layout'],
            assets: ['/static/js/async/four_user/layout.js'],
            referenceCssAssets: [],
          },
        },
      };
      const pathname = '/four/user/profile';
      const nonce = 'four';

      const result = getAssetsTags(
        html,
        nestedRoutes,
        routesJson,
        routesManifest,
        pathname,
        nonce,
      );
      const { cssLinks, scripts } = result;
      expect(Array.isArray(cssLinks)).toBe(true);
      expect(Array.isArray(scripts)).toBe(true);
      expect(cssLinks).toEqual([
        '<link rel="stylesheet" type="text/css" href="/static/css/async/four_user/profile/page.css">',
      ]);
      expect(scripts).toEqual([
        '<script defer src="/static/js/async/four_user/layout.js" nonce="four"></script>',
        '<script defer src="/static/js/async/four_user/profile/page.js" nonce="four"></script>',
      ]);
    });
  });

  describe('injectAssetsTags', () => {
    it('should inject both css links and scripts into html', () => {
      const html = `<html><head></head><body>${HTML_CHUNKSMAP_SEPARATOR}</body></html>`;
      const cssLinks = [
        '<link rel="stylesheet" type="text/css" href="asset1.css">',
      ];
      const scripts = ['<script defer src="asset2.js"></script>'];

      const result = injectAssetsTags(html, cssLinks, scripts);

      expect(result).toContain(
        '<link rel="stylesheet" type="text/css" href="asset1.css"></head>',
      );
      expect(result).toContain('<script defer src="asset2.js"></script>');
    });

    it('should return html unchanged if no css links or scripts are provided', () => {
      const html = '<html><head></head><body></body></html>';

      const result = injectAssetsTags(html);

      expect(result).toBe(html);
    });
  });
});
