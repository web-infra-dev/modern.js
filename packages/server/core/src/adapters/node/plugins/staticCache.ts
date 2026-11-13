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

// '' for the output root, e.g. `output.distPath.js: '.'`.
const normalizeDir = (dir: string) => {
  const normalized = dir.replace(/^\.?\/?/, '').replace(/\/+$/, '');
  return normalized ? `${normalized}/` : '';
};

/**
 * Build assets live in the build output directories and have a content hash
 * in the file name. Requiring both keeps files like
 * `upload/report.20261101.pdf` from being cached as immutable. Files in the
 * directories holding user files (`userDirs`) are never build assets, even
 * inside a build output directory. When assets are emitted to the output root,
 * every other directory counts as a build output directory.
 */
export function createHashedAssetMatcher(
  assetDirs: string[],
  userDirs: string[] = [],
) {
  const dirs = ['static/', ...assetDirs.map(normalizeDir)];
  const isInAssetDir = (relativePath: string) =>
    !userDirs.some(userDir => relativePath.startsWith(userDir)) &&
    dirs.some(dir => !dir || relativePath.startsWith(dir));
  return (relativePath: string) =>
    isInAssetDir(relativePath) &&
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

// Quoted entity tags may contain commas, e.g. `"version,1"`, so the header is
// not split on commas.
const ENTITY_TAG_REGEX = /(?:W\/)?"[^"]*"/g;

/**
 * Set `ETag` and `Cache-Control` of a static file, and return whether the
 * request can be answered with `304 Not Modified`. Headers that are already
 * set, e.g. by a middleware before `await next()` or by a public route, are
 * kept, and an existing `ETag` is the one that is compared.
 */
export function setStaticFileHeaders(
  c: Context,
  data: Buffer,
  cacheControl?: string,
): boolean {
  // Includes the headers set with `c.header()` before the response is created.
  const { headers } = c.res;
  let etag = headers.get('ETag');
  if (!etag) {
    etag = getETag(data);
    c.header('ETag', etag);
  }
  if (cacheControl && !headers.has('Cache-Control')) {
    c.header('Cache-Control', cacheControl);
  }

  const { method } = c.req;
  const ifNoneMatch = c.req.header('If-None-Match');
  if ((method !== 'GET' && method !== 'HEAD') || !ifNoneMatch) {
    return false;
  }
  const expected = stripWeak(etag);
  return (
    ifNoneMatch.trim() === '*' ||
    (ifNoneMatch.match(ENTITY_TAG_REGEX) || []).some(
      value => stripWeak(value) === expected,
    )
  );
}
