import { appTools, defineConfig } from '@modern-js/app-tools';
import { bffPlugin } from '@modern-js/plugin-bff';
import { applyBaseConfig } from '../../utils/applyBaseConfig';

// https://modernjs.dev/docs/apis/app/config
export default applyBaseConfig({
  bff: {
    enableHandleWeb: true,
  },
  dev: {
    // This suite clicks right after `domcontentloaded`, racing hydration, and
    // the ESM CLI runtime re-imports server bundles per request in dev, so
    // under CI load the default lazy compilation's compile round-trips made
    // the client-nav test flaky. Default-on lazy compilation for stream SSR
    // stays covered by the `ssr` streaming suites.
    lazyCompilation: false,
  },
  server: {
    ssr: {
      mode: 'stream',
    },
  },
  output: {
    disableTsChecker: true,
    distPath: {
      root: process.env.TEST_DIST || 'dist',
    },
  },
  plugins: [bffPlugin()],
});
