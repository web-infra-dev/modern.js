import { appTools, defineConfig } from '@modern-js/app-tools';
import { bffPlugin } from '@modern-js/plugin-bff';
import { serverPlugin } from '@modern-js/plugin-server';

export default defineConfig({
  bff: {
    prefix: '/api',
  },
  dev: {
    port: 3000,
  },
  html: {
    appIcon: './src/assets/icon.png',
    disableHtmlFolder: true,
  },
  output: {
    cssModuleLocalIdentName: '[name]__[local]-[hash:base64:5]',
    disableSourceMap: true,
    disableMinimize: false,
    enableInlineStyles: false,
  },
  runtime: {
    router: {
      supportHtml5History: true,
    },
    state: true,
  },
  source: {
    resolveMainFields: ['browser', 'module', 'main'],
    moduleScopes: [],
    enableCustomEntry: true,
    disableEntryDirs: ['legacy-app', 'legacy-routes'],
  },
  tools: {
    devServer: {
      client: {
        port: 3001,
      },
      hot: false,
    },
    webpack(config) {
      return config;
    },
    webpackChain(chain) {
      chain.name('app');
    },
  },
  plugins: [appTools({ bundler: 'rspack' }), serverPlugin(), bffPlugin()],
});
