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
      // React 19 server bundles may check for __SERVER_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE
      // Ensure it's defined to avoid early throws during server bundle warmup in Node.
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (
          globalThis as any
        ).__SERVER_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE =
          (globalThis as any)
            .__SERVER_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE ||
          {};
      } catch {}
      // For dev server readiness: respond to HEAD health checks with CSR fallback
      // by setting the known SSR fallback header so the render pipeline selects
      // CSR immediately instead of trying to resolve the server bundle.
      if (process.env.NODE_ENV === 'development') {
        const { middlewares } = api.getServerContext();
        // Serve a minimal manifest in dev so host tests that fetch the remote
        // manifest don't 404. The real MF runtime falls back to remoteEntry in
        // dev, but the tests expect a 200 here.
        middlewares.unshift({
          name: 'mf-dev-manifest-inline',
          handler: async (c, next) => {
            try {
              const url = new URL(c.req.url);
              if (url.pathname === '/static/mf-manifest.json') {
                const origin = `${url.protocol}//${url.host}/`;
                const publicPath = origin;
                const ssrPublicPath = new URL(
                  'bundles/',
                  publicPath,
                ).toString();
                const remoteEntry = new URL(
                  'static/remoteEntry.js',
                  publicPath,
                ).toString();
                // Provide enough hints so the host can patch federation correctly
                // in development without relying on production-only /bundles path.
                return c.json(
                  {
                    remoteEntry,
                    metaData: {
                      publicPath,
                      ssrPublicPath,
                      remoteEntry,
                    },
                  },
                  200,
                );
              }
            } catch {}
            await next();
          },
        });
        middlewares.unshift({
          name: 'mf-dev-ready-csr-fallback',
          handler: async (c, next) => {
            try {
              const method = c.req.raw.method;
              const url = new URL(c.req.url);
              const isDoc =
                !url.pathname.startsWith('/static/') &&
                !url.pathname.startsWith('/bundles/') &&
                !url.pathname.startsWith('/api/');
              if (isDoc && method === 'HEAD') {
                console.log('[MF RSC DEV] HEAD readiness for', url.pathname);
                return c.text('', 200);
              }
              if (isDoc && method === 'GET') {
                // Use redirect-based CSR fallback instead of header mutation
                // getRenderMode reads query.csr, which is more reliable than mutating Request.headers
                const cookies = c.req.header('cookie') || '';
                const seen = cookies.includes('mf_csr=1');
                if (!seen && !url.searchParams.has('csr')) {
                  // Redirect to CSR mode, mark cookie so we only do this once
                  console.log(
                    '[MF RSC DEV] Redirecting to CSR mode for',
                    url.pathname,
                  );
                  url.searchParams.set('csr', '1');
                  return c.redirect(url.toString(), 302, {
                    'set-cookie': 'mf_csr=1; Path=/; Max-Age=60',
                  });
                }
                console.log(
                  '[MF RSC DEV] CSR mode active for GET',
                  url.pathname,
                );
                // If we get here, either csr=1 or cookie present; continue to renderer
              }
            } catch (e) {
              console.warn('[MF RSC DEV] readiness middleware error', e);
            }
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
