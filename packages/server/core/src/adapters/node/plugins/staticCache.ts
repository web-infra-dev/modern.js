import path from 'path';
import type { Context } from 'hono';
import type { ServerNormalizedConfig } from '../../../types';

export type ResolvedStaticCacheControl = {
  hashed: string;
  unhashed: string;
};

const DEFAULT_HASHED_CACHE_CONTROL = 'public, max-age=31536000, immutable';

// Cached, but revalidated with `ETag` / `Last-Modified` on every use.
const DEFAULT_UNHASHED_CACHE_CONTROL = 'no-cache';

// e.g. `main.3f2a1b9c0d.js` or `logo.3f2a1b9c.png`
const CONTENT_HASH_REGEX = /[.-][0-9a-f]{8,}\.[^./]+$/i;

/**
 * Resolve `server.staticCacheControl`. During development every static file
 * is revalidated, so an edited file is never served from the browser cache.
 */
export function resolveStaticCacheControl(
  staticCacheControl: ServerNormalizedConfig['staticCacheControl'],
): ResolvedStaticCacheControl | undefined {
  if (staticCacheControl === false) {
    return undefined;
  }
  if (process.env.NODE_ENV !== 'production') {
    return { hashed: 'no-cache', unhashed: 'no-cache' };
  }
  const options =
    typeof staticCacheControl === 'object' ? staticCacheControl : {};
  return {
    hashed: options.hashed ?? DEFAULT_HASHED_CACHE_CONTROL,
    unhashed: options.unhashed ?? DEFAULT_UNHASHED_CACHE_CONTROL,
  };
}

const normalizeDir = (dir: string) =>
  `${dir.replace(/^\.?\//, '').replace(/\/+$/, '')}/`;

/**
 * Build assets live in the build output directories and have a content hash
 * in the file name. Requiring both keeps files like
 * `upload/report.20261101.pdf` from being cached as immutable.
 */
export function createHashedAssetMatcher(assetDirs: string[]) {
  const dirs = ['static/', ...assetDirs.map(normalizeDir)];
  return (relativePath: string) =>
    dirs.some(dir => relativePath.startsWith(dir)) &&
    CONTENT_HASH_REGEX.test(path.basename(relativePath));
}

type FileStats = { size: number; mtimeMs: number; mtime: Date };

const stripWeak = (etag: string) => etag.trim().replace(/^W\//, '');

/**
 * Set `ETag`, `Last-Modified` and `Cache-Control` of a static file, and
 * return whether the request can be answered with `304 Not Modified`.
 */
export function setStaticFileHeaders(
  c: Context,
  stats: FileStats,
  cacheControl?: string,
): boolean {
  // Weak, since the same file may be sent with different encodings.
  const etag = `W/"${stats.size.toString(16)}-${Math.floor(stats.mtimeMs).toString(16)}"`;
  c.header('ETag', etag);
  // Without `Cache-Control`, browsers may cache a response that has
  // `Last-Modified` for a heuristic time without revalidating it.
  if (cacheControl) {
    c.header('Cache-Control', cacheControl);
    c.header('Last-Modified', stats.mtime.toUTCString());
  }

  const { method } = c.req;
  if (method !== 'GET' && method !== 'HEAD') {
    return false;
  }
  const ifNoneMatch = c.req.header('If-None-Match');
  if (ifNoneMatch) {
    return (
      ifNoneMatch.trim() === '*' ||
      ifNoneMatch.split(',').some(value => stripWeak(value) === stripWeak(etag))
    );
  }
  if (!cacheControl) {
    return false;
  }
  const ifModifiedSince = Date.parse(c.req.header('If-Modified-Since') || '');
  // HTTP dates have a precision of one second.
  return (
    !Number.isNaN(ifModifiedSince) &&
    Math.floor(stats.mtimeMs / 1000) * 1000 <= ifModifiedSince
  );
}
