import type { Rspack } from '@modern-js/builder';
import type { Middleware } from '@modern-js/server-core';

/** Keep in sync with rspack's LAZY_COMPILATION_PREFIX. */
const DEFAULT_LAZY_COMPILATION_PREFIX = '/_rspack/lazy/trigger';

/**
 * Collect the lazy-compilation endpoint prefixes actually configured on the
 * (multi-)compiler, so the CORS middleware only ever touches those paths.
 */
export const getLazyCompilationPrefixes = (
  compiler: Rspack.Compiler | Rspack.MultiCompiler | null,
): string[] => {
  if (!compiler) {
    return [];
  }
  const compilers = 'compilers' in compiler ? compiler.compilers : [compiler];
  const prefixes = new Set<string>();
  for (const { options } of compilers) {
    const { lazyCompilation } = options;
    if (!lazyCompilation) {
      continue;
    }
    prefixes.add(
      (typeof lazyCompilation === 'object' && lazyCompilation.prefix) ||
        DEFAULT_LAZY_COMPILATION_PREFIX,
    );
  }
  return [...prefixes];
};

/**
 * Rspack's lazy-compilation client triggers module compilation with a
 * `text/plain` POST to `lazyCompilation.serverUrl` + prefix. When the page is
 * served from a proxied domain (Whistle / Eden Proxy mapping an online domain
 * to the local dev server) while `serverUrl` points at `127.0.0.1` (derived
 * from `dev.client`), that POST is cross-origin, and rspack's middleware
 * replies without any CORS headers: the request still reaches the compiler
 * (simple request) and invalidates the build, but the browser blocks the
 * response, so dynamic imports fail and the page reload-loops.
 *
 * Reflecting the Origin here keeps the direct-connect setup working — the same
 * reason the HMR WebSocket connects straight to 127.0.0.1, except WebSockets
 * are exempt from CORS while XHR is not. Only the lazy-compilation prefixes
 * are opened up: the endpoint merely triggers compilation and never returns
 * source, and the global `server.cors` config stays untouched.
 *
 * This middleware is a stopgap for rspack's lazyCompilationMiddleware lacking
 * CORS handling. If a bundled rspack ships native CORS for this endpoint,
 * verify its semantics cover the proxied-domain case and remove (or
 * capability-gate) this layer in the same dependency bump — answering the
 * preflight here would otherwise mask the native policy.
 */
export const createLazyCompilationCorsMiddleware = (
  prefixes: string[],
): Middleware => {
  return async (ctx, next) => {
    const { path } = ctx.req;
    if (!prefixes.some(prefix => path.startsWith(prefix))) {
      return next();
    }

    const origin = ctx.req.header('origin');
    if (!origin) {
      return next();
    }

    if (
      ctx.req.method === 'OPTIONS' &&
      ctx.req.header('access-control-request-method')
    ) {
      // CORS preflight. The Private-Network-Access response header is kept
      // for compatibility with browsers that still send the request header —
      // Chrome's PNA preflight rollout is paused (superseded by the
      // user-permission Local Network Access model in Chrome 142), so this
      // does NOT claim to satisfy any future local-network gating.
      const headers: Record<string, string> = {
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers':
          ctx.req.header('access-control-request-headers') || 'content-type',
        Vary: 'Origin',
      };
      if (ctx.req.header('access-control-request-private-network') === 'true') {
        headers['Access-Control-Allow-Private-Network'] = 'true';
      }
      return ctx.body(null, 204, headers);
    }

    // The rspack middleware behind `rsbuild-dev` writes straight to the raw
    // node response (`res.writeHead(200)`), bypassing hono's header handling,
    // so the reflected headers must be set on the raw response too.
    const nodeRes = ctx.env?.node?.res;
    if (nodeRes && !nodeRes.headersSent) {
      nodeRes.setHeader('Access-Control-Allow-Origin', origin);
      nodeRes.setHeader('Vary', 'Origin');
    }
    return next();
  };
};
