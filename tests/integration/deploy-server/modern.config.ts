import AppToolsPlugin, { defineConfig } from '@modern-js/app-tools';
import bff from '@modern-js/plugin-bff';

// https://modernjs.dev/docs/apis/app/config
export default defineConfig({
  plugins: [AppToolsPlugin(), bff()],
  performance: {
    buildCache: false,
  },
  output: {
    distPath: {
      root: process.env.TEST_DIST || 'dist',
    },
  },
  server: {
    ssr: {
      bundleServer: process.env.TEST_BUNDLE_SERVER === 'true',
    },
  },
});
