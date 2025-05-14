import { appTools, defineConfig } from '@modern-js/app-tools';
import { bffPlugin } from '@modern-js/plugin-bff';
import { koaPlugin } from '@modern-js/plugin-koa';
import { applyBaseConfig } from '../../utils/applyBaseConfig';

// https://modernjs.dev/docs/apis/app/config
export default applyBaseConfig({
  bff: {
    enableHandleWeb: true,
  },
  runtime: {
    router: true,
  },
  source: {
    moduleScopes: [/plugin-data-loader/],
  },
  server: {
    ssr: {
      mode: 'stream',
    },
  },
  output: {
    disableTsChecker: true,
  },
  plugins: [bffPlugin(), koaPlugin()],
});
