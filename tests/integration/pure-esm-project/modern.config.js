import { appTools, defineConfig } from '@modern-js/app-tools';
import { bffPlugin } from '@modern-js/plugin-bff';
import { applyBaseConfig } from '../../utils/applyBaseConfig';

// https://modernjs.dev/docs/apis/app/config
export default applyBaseConfig({
  bff: {
    enableHandleWeb: true,
  },
  server: {
    ssr: {
      mode: 'stream',
      bundleServer: process.env.TEST_BUNDLE_SERVER === 'true',
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
