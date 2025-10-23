import path from 'node:path';
import type { MiddlewareHandler } from '@modern-js/server-runtime';
import fs from 'fs-extra';
import { fileCache } from './fileCache';

const bundlesAssetPrefix = '/bundles';
// Remove domain name from assetPrefix if it exists
// and remove trailing slash if it exists, if the url is a single slash, return it as empty string
const removeHost = (url: string): string => {
  try {
    // Extract pathname
    const hasProtocol = url.includes('://');
    const hasDomain = hasProtocol || url.startsWith('//');
    const pathname = hasDomain
      ? new URL(hasProtocol ? url : `http:${url}`).pathname
      : url;

    return pathname;
  } catch (e) {
    return url;
  }
};

const createStaticMiddleware = (options: {
  assetPrefix: string;
  pwd: string;
}): MiddlewareHandler => {
  const { assetPrefix, pwd } = options;

  const allowedRootJsonFiles = new Set([
    'react-client-manifest.json',
    'react-ssr-manifest.json',
    'server-references-manifest.json',
    'route.json',
  ]);

  const applyCorsHeaders = (c: Parameters<MiddlewareHandler>[0]) => {
    if (!process.env.MODERN_MF_AUTO_CORS) {
      return;
    }
    c.header('Access-Control-Allow-Origin', '*');
    c.header(
      'Access-Control-Allow-Methods',
      'GET, POST, PUT, DELETE, PATCH, OPTIONS',
    );
    c.header('Access-Control-Allow-Headers', '*');
  };

  return async (c, next) => {
    const pathname = c.req.path;
    const ext = path.extname(pathname);

    // We only handle js & json files for performance
    if (ext !== '.js' && ext !== '.json') {
      return next();
    }

    const prefixWithoutHost = removeHost(assetPrefix);
    const prefixWithBundle = path.join(prefixWithoutHost, bundlesAssetPrefix);
    // Skip if the request is not for asset prefix + `/bundles`
    if (pathname.startsWith(prefixWithBundle)) {
      const pathnameWithoutPrefix = pathname.replace(prefixWithBundle, '');
      const filepath = path.join(
        pwd,
        bundlesAssetPrefix,
        pathnameWithoutPrefix,
      );

      if (await fs.pathExists(filepath)) {
        const fileResult = await fileCache.getFile(filepath);
        if (!fileResult) {
          return next();
        }

        c.header(
          'Content-Type',
          ext === '.json' ? 'application/json' : 'application/javascript',
        );
        c.header('Content-Length', String(fileResult.content.length));
        applyCorsHeaders(c);
        return c.body(fileResult.content, 200);
      }
    } else if (ext === '.json') {
      const manifestName = path.basename(pathname);
      if (allowedRootJsonFiles.has(manifestName)) {
        if (process.env.DEBUG_MF_RSC_SERVER) {
          console.log('[MF RSC] Serving root manifest', manifestName);
        }
        const manifestPath = path.join(pwd, manifestName);
        if (await fs.pathExists(manifestPath)) {
          const fileResult = await fileCache.getFile(manifestPath);
          if (!fileResult) {
            return next();
          }
          c.header('Content-Type', 'application/json');
          c.header('Content-Length', String(fileResult.content.length));
          applyCorsHeaders(c);
          return c.body(fileResult.content, 200);
        }
      }
    }

    return next();
  };
};

const createCorsMiddleware = (): MiddlewareHandler => {
  return async (c, next) => {
    const pathname = c.req.path;
    // If the request is only for a static file
    if (path.extname(pathname)) {
      c.header('Access-Control-Allow-Origin', '*');
      c.header(
        'Access-Control-Allow-Methods',
        'GET, POST, PUT, DELETE, PATCH, OPTIONS',
      );
      c.header('Access-Control-Allow-Headers', '*');
    }
    return next();
  };
};

export { createStaticMiddleware, createCorsMiddleware };
