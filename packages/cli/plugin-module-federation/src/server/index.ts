import type { ServerPlugin } from '@modern-js/server-runtime';
import {
  createCorsMiddleware,
  createStaticMiddleware,
} from './staticMiddleware';

const staticServePlugin = (): ServerPlugin => ({
  name: '@modern-js/module-federation/server',
  setup: api => {
    api.onPrepare(() => {
      // In development, we don't need to serve the manifest file, bundler dev server will handle it
      if (process.env.NODE_ENV === 'development') {
        return;
      }

      const { middlewares } = api.getServerContext();
      const config = api.getServerConfig();

      const assetPrefix = config.output?.assetPrefix || '';
      // Serve federated JavaScript from the configured server output directory.
      if (config.server?.ssr) {
        const context = api.getServerContext();
        const pwd = context.distDirectory!;
        const serverStaticMiddleware = createStaticMiddleware({
          assetPrefix,
          pwd,
          serverDirectory: config.output?.distPath?.server,
        });
        middlewares.push({
          name: 'module-federation-serve-manifest',
          handler: serverStaticMiddleware,
        });
      }

      // When the MODERN_MF_AUTO_CORS environment variable is set, the server will add CORS headers to the response
      // This environment variable should only be set when running `serve` command in local test.
      if (process.env.MODERN_MF_AUTO_CORS) {
        const corsMiddleware = createCorsMiddleware();
        middlewares.push({
          name: 'module-federation-cors',
          handler: corsMiddleware,
        });
      }
    });
  },
});

export default staticServePlugin;
export { staticServePlugin };
