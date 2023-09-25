import { appTools, defineConfig } from '@modern-js/app-tools';
import { ROUTE_BASENAME } from '@modern-js/devtools-kit';
import { version } from './package.json';

// https://modernjs.dev/en/configure/app/usage
export default defineConfig<'rspack'>({
  runtime: {
    router: {
      basename: ROUTE_BASENAME,
    },
  },
  dev: {
    assetPrefix: ROUTE_BASENAME,
    port: 8780,
  },
  source: {
    preEntry: [require.resolve('modern-normalize/modern-normalize.css')],
    globalVars: {
      'process.env.PKG_VERSION': version,
    },
  },
  output: {
    assetPrefix: ROUTE_BASENAME,
    enableCssModuleTSDeclaration: true,
  },
  plugins: [appTools({ bundler: 'experimental-rspack' })],
});
