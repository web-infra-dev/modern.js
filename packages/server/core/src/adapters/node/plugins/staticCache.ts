import { createHash } from 'node:crypto';
import path from 'path';
import type { Context } from 'hono';
import type { ServerNormalizedConfig } from '../../../types';

export type ResolvedStaticCacheControl = {
  hashed: string;
  unhashed: string;
};

const DEFAULT_HASHED_CACHE_CONTROL = 'public, max-age=31536000, immutable';

// Cached, but revalidated with the `ETag` on every use.
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

// Keyed by the content buffer that `fileReader` caches, so the hash of a file
// is computed once and dropped together with the buffer.
const etags = new WeakMap<Buffer, string>();

/**
 * The `ETag` is computed from the bytes that are sent, not from file stats:
 * `fileReader` may serve a cached copy of a changed file, or read it from the
 * compiler's in-memory filesystem in development, and the validator must
 * always describe the body it is sent with. Weak, since the same file may be
 * sent with different encodings.
 */
function getETag(data: Buffer) {
  let etag = etags.get(data);
  if (!etag) {
    const hash = createHash('sha1').update(data).digest('base64url');
    etag = `W/"${data.byteLength.toString(16)}-${hash.slice(0, 22)}"`;
    etags.set(data, etag);
  }
  return etag;
}

const stripWeak = (etag: string) => etag.trim().replace(/^W\//, '');

/**
 * Set `ETag` and `Cache-Control` of a static file, and return whether the
 * request can be answered with `304 Not Modified`.
 */
export function setStaticFileHeaders(
  c: Context,
  data: Buffer,
  cacheControl?: string,
): boolean {
  const etag = getETag(data);
  c.header('ETag', etag);
  if (cacheControl) {
    c.header('Cache-Control', cacheControl);
  }

  const { method } = c.req;
  const ifNoneMatch = c.req.header('If-None-Match');
  if ((method !== 'GET' && method !== 'HEAD') || !ifNoneMatch) {
    return false;
  }
  return (
    ifNoneMatch.trim() === '*' ||
    ifNoneMatch.split(',').some(value => stripWeak(value) === stripWeak(etag))
  );
}
