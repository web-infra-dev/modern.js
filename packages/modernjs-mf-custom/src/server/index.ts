import type { ServerPlugin } from '@modern-js/server-runtime';
import {
  createCorsMiddleware,
  createStaticMiddleware,
} from './staticMiddleware';

const staticServePlugin = (): ServerPlugin => ({
  // Use the actual module id that resolves from our package exports.
  name: '@module-federation/modern-js-rsc/server',
  setup: api => {
    api.onPrepare(() => {
      // For dev server readiness: respond to HEAD health checks with CSR fallback
      // by setting the known SSR fallback header so the render pipeline selects
      // CSR immediately instead of trying to resolve the server bundle.
      if (process.env.NODE_ENV === 'development') {
        const { middlewares } = api.getServerContext();
        middlewares.unshift({
          name: 'mf-dev-ready-head-csr',
          handler: async (c, next) => {
            try {
              const req = c.req.raw;
              if (req.method === 'HEAD') {
                c.req.headers.set('x-modernjs-ssr-fallback', '1;reason=dev-ready');
                c.req.headers.set('x-modern-js-ssr-fallback', '1;reason=dev-ready');
              }
            } catch {}
            await next();
          },
        });
      }
      // In development, manifest/static files are handled by the dev server; skip static middleware below.
      if (process.env.NODE_ENV === 'development') {
        return;
      }

      const { middlewares } = api.getServerContext();
      const config = api.getServerConfig();

      const assetPrefix = config.output?.assetPrefix || '';
      if (process.env.DEBUG_MF_RSC_SERVER) {
        console.log('[MF RSC] Server config snapshot:', config.server);
      }
      // When SSR is enabled, we need to serve the files in `bundle/` directory externally
      // Modern.js will only serve the files in `static/` directory
      if (config.server?.ssr || config.server?.rsc) {
        if (process.env.DEBUG_MF_RSC_SERVER) {
          console.log(
            '[MF RSC] Enabling static middleware for manifest serving',
          );
        }
        const context = api.getServerContext();
        const pwd = context.distDirectory!;
        const serverStaticMiddleware = createStaticMiddleware({
          assetPrefix,
          pwd,
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
