import { appTools, defineConfig } from '@modern-js/app-tools';
import { proxyPlugin } from '@modern-js/plugin-proxy';
import { version } from './package.json';

// https://modernjs.dev/en/configure/app/usage
export default defineConfig<'rspack'>({
  runtime: {
    router: {
      basename: '/_modern_js/devtools',
    },
  },
  dev: {
    assetPrefix: '/_modern_js/devtools',
    port: 8780,
  },
  source: {
    preEntry: [require.resolve('modern-normalize/modern-normalize.css')],
    globalVars: {
      'process.env.PKG_VERSION': version,
    },
  },
  output: {
    assetPrefix: '/_modern_js/devtools',
    enableCssModuleTSDeclaration: true,
  },
  tools: {},
  html: {},
  plugins: [appTools({ bundler: 'experimental-rspack' }), proxyPlugin()],
});
