import { appTools, defineConfig } from '@modern-js/app-tools';
import { bffPlugin } from '@modern-js/plugin-bff';
import { koaPlugin } from '@modern-js/plugin-koa';

// https://modernjs.dev/docs/apis/app/config
export default defineConfig({
  bff: {
    enableHandleWeb: true,
  },
  runtime: {
    router: true,
  },
  source: {
    moduleScopes: [/plugin-data-loader/, /app-tools/],
  },
  server: {
    ssr: {
      mode: 'stream',
    },
  },
  output: {
    disableTsChecker: true,
  },
  plugins: [appTools({}), bffPlugin(), koaPlugin()],
});
