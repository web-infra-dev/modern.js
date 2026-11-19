import { appTools, defineConfig } from '@modern-js/app-tools';
import bff from '@modern-js/plugin-bff';

const server = process.env.DEPLOY_MODE !== 'csr';

export default defineConfig({
  plugins: server ? [appTools(), bff()] : [appTools()],
  performance: {
    buildCache: false,
  },
  output: {
    distPath: {
      root: process.env.TEST_DIST || 'dist',
    },
  },
  server: {
    ssr: server,
  },
});
