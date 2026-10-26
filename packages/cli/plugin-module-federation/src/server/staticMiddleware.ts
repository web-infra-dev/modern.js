import { access } from 'fs/promises';
import path from 'node:path';
import { SERVER_BUNDLE_DIRECTORY } from '@modern-js/utils';
import { fileCache } from './fileCache';
import type { MiddlewareHandler } from '@modern-js/server-runtime';

const pathExists = async (filepath: string): Promise<boolean> => {
  try {
    await access(filepath);
    return true;
  } catch {
    return false;
  }
};

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
  serverDirectory?: string;
}): MiddlewareHandler => {
  const {
    assetPrefix,
    pwd,
    serverDirectory = SERVER_BUNDLE_DIRECTORY,
  } = options;
  const prefixWithBundle = path.posix.join(
    '/',
    removeHost(assetPrefix),
    serverDirectory,
  );
  const root = path.resolve(pwd, serverDirectory);

  return async (c, next) => {
    const pathname = c.req.path;

    // We only handle js file for performance
    if (path.extname(pathname) !== '.js') {
      return next();
    }

    // Only serve JavaScript below the configured server output prefix.
    if (!pathname.startsWith(`${prefixWithBundle}/`)) {
      return next();
    }

    const pathnameWithoutPrefix = pathname.replace(prefixWithBundle, '');
    const filepath = path.resolve(root, `.${pathnameWithoutPrefix}`);
    if (!filepath.startsWith(`${root}${path.sep}`)) return next();
    if (!(await pathExists(filepath))) {
      return next();
    }

    const fileResult = await fileCache.getFile(filepath);
    if (!fileResult) {
      return next();
    }

    c.header('Content-Type', 'application/javascript');
    c.header('Content-Length', String(Buffer.byteLength(fileResult.content)));
    return c.body(fileResult.content, 200);
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
