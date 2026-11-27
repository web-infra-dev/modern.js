import zlib from 'node:zlib';
import { COMPRESSIBLE_CONTENT_TYPE_REGEX } from 'hono/utils/compress';
import { getMimeType } from 'hono/utils/mime';
import type {
  CompressEncoding,
  Middleware,
  ServerNormalizedConfig,
  ServerPlugin,
} from '../../../types';

export type ResolvedCompressOptions = {
  threshold: number;
  encodings: CompressEncoding[];
};

const DEFAULT_THRESHOLD = 1024;

const DEFAULT_ENCODINGS: CompressEncoding[] = ['br', 'gzip'];

// Files are compressed once and then served from memory, quality 11 would
// delay the first request of a large file by about a second.
const BROTLI_OPTIONS: zlib.BrotliOptions = {
  params: { [zlib.constants.BROTLI_PARAM_QUALITY]: 9 },
};

const GZIP_OPTIONS: zlib.ZlibOptions = { level: 6 };

const NO_TRANSFORM_REGEX = /(?:^|,)\s*no-transform\s*(?:,|$)/i;

/**
 * Resolve `server.compress`. Compression is only applied by the production
 * server, to the static files it serves. It is enabled by default for the
 * Node.js server, and must be enabled explicitly for other runtimes, which
 * usually compress at the edge.
 */
export function resolveCompressOptions(
  compress: ServerNormalizedConfig['compress'],
  enabledByDefault: boolean,
): ResolvedCompressOptions | undefined {
  if (process.env.NODE_ENV !== 'production' || compress === false) {
    return undefined;
  }
  if (compress === undefined && !enabledByDefault) {
    return undefined;
  }
  const options = typeof compress === 'object' ? compress : {};
  return {
    threshold: options.threshold ?? DEFAULT_THRESHOLD,
    encodings: options.encodings?.length
      ? options.encodings
      : DEFAULT_ENCODINGS,
  };
}

export function isCompressible(contentType?: string | null) {
  return Boolean(
    contentType && COMPRESSIBLE_CONTENT_TYPE_REGEX.test(contentType),
  );
}

/**
 * Pick the first encoding in server preference order that the client accepts.
 */
export function negotiateEncoding(
  acceptEncoding: string | undefined,
  encodings: CompressEncoding[],
): CompressEncoding | undefined {
  if (!acceptEncoding) {
    return undefined;
  }
  const qualities = new Map<string, number>();
  for (const part of acceptEncoding.split(',')) {
    // Whitespace is allowed around `;`, e.g. `br ;q=0`.
    const [name, ...params] = part
      .split(';')
      .map(token => token.trim().toLowerCase());
    if (!name) {
      continue;
    }
    let quality = 1;
    for (const param of params) {
      const [key, value] = param.split('=').map(token => token.trim());
      if (key === 'q') {
        quality = Number(value);
      }
    }
    qualities.set(name, Number.isNaN(quality) ? 0 : quality);
  }
  const wildcard = qualities.get('*');
  return encodings.find(encoding => {
    const quality = qualities.get(encoding) ?? wildcard;
    return quality !== undefined && quality > 0;
  });
}

function appendVary(headers: Headers) {
  const vary = headers.get('Vary');
  if (!vary) {
    headers.set('Vary', 'Accept-Encoding');
  } else if (
    vary.trim() !== '*' &&
    !vary.split(',').some(v => v.trim().toLowerCase() === 'accept-encoding')
  ) {
    headers.set('Vary', `${vary}, Accept-Encoding`);
  }
}

// The compressed bytes differ from the uncompressed ones, so a strong `ETag`
// set by a route or middleware can't be shared between them.
function weakenETag(headers: Headers) {
  const etag = headers.get('ETag');
  if (etag && !etag.startsWith('W/')) {
    headers.set('ETag', `W/${etag}`);
  }
}

type CompressedFile = {
  source: Buffer;
  results: Partial<Record<CompressEncoding, Promise<Buffer>>>;
  // Bytes of the source and the compressed results held by this entry.
  size: number;
};

let maxCachedBytes = 64 * 1024 * 1024;

/**
 * @internal for tests
 */
export function setCompressedFileCacheLimit(bytes: number) {
  maxCachedBytes = bytes;
}

/**
 * @internal for tests
 */
export function getCompressedFileCacheSize() {
  return cachedBytes;
}

// Keyed by file path, in least recently used order. Concurrent first requests
// may read a file into different buffers, so the content is compared when the
// buffer changes, and a changed file is compressed again.
const compressedFiles = new Map<string, CompressedFile>();

let cachedBytes = 0;

function removeFile(filepath: string, file: CompressedFile) {
  if (compressedFiles.get(filepath) === file) {
    compressedFiles.delete(filepath);
    cachedBytes -= file.size;
  }
}

function addCachedBytes(filepath: string, file: CompressedFile, bytes: number) {
  if (compressedFiles.get(filepath) !== file) {
    return;
  }
  file.size += bytes;
  cachedBytes += bytes;
  for (const [key, entry] of compressedFiles) {
    if (cachedBytes <= maxCachedBytes) {
      break;
    }
    removeFile(key, entry);
  }
}

function compressFile(
  filepath: string,
  data: Buffer,
  encoding: CompressEncoding,
) {
  let file = compressedFiles.get(filepath);
  if (file && file.source !== data && !file.source.equals(data)) {
    removeFile(filepath, file);
    file = undefined;
  }
  if (file) {
    // Keep the buffer that `fileReader` caches now, so the next lookup is an
    // identity check, and mark the entry as recently used.
    file.source = data;
    compressedFiles.delete(filepath);
    compressedFiles.set(filepath, file);
  } else {
    file = { source: data, results: {}, size: 0 };
    compressedFiles.set(filepath, file);
    addCachedBytes(filepath, file, data.byteLength);
  }
  const current = file;
  let compressed = current.results[encoding];
  if (!compressed) {
    compressed = new Promise<Buffer>((resolve, reject) => {
      const callback = (error: Error | null, result: Buffer) =>
        error ? reject(error) : resolve(result);
      if (encoding === 'br') {
        zlib.brotliCompress(data, BROTLI_OPTIONS, callback);
      } else {
        zlib.gzip(data, GZIP_OPTIONS, callback);
      }
    });
    current.results[encoding] = compressed;
    compressed.then(
      result => addCachedBytes(filepath, current, result.byteLength),
      () => {
        delete current.results[encoding];
      },
    );
  }
  return compressed;
}

type StaticFile = {
  filepath: string;
  data: Buffer;
  // `null` for a `304` response.
  body: ReadableStream | null;
};

// Static file responses by request, with the file they were read from. Only
// these responses are compressed. The compress middleware decides on the final
// response headers, so a header set by any middleware is respected, and then
// serves the cached compressed content of the file. The response is looked up
// by request, since a `304` has no body to identify it.
const staticFiles = new WeakMap<Request, StaticFile>();

/**
 * Mark a response as the content of a static file, or as a `304` for it.
 * Returns the response.
 */
export function registerStaticFile(
  req: Request,
  res: Response,
  filepath: string,
  data: Buffer,
) {
  staticFiles.set(req, { filepath, data, body: res.body });
  return res;
}

/**
 * Compress the static files served by `serverStaticPlugin`. Other responses,
 * such as SSR pages and BFF responses, are left unchanged, so they don't need
 * a `Vary: Accept-Encoding` header.
 */
export function createCompressMiddleware(
  options: ResolvedCompressOptions,
): Middleware {
  return async (c, next) => {
    await next();

    const { res } = c;
    const { headers, body } = res;
    const staticFile = staticFiles.get(c.req.raw);
    const notModified = res.status === 304;
    // The body is replaced when a middleware changes the content of a file.
    if (!staticFile || (!notModified && (!body || body !== staticFile.body))) {
      return;
    }
    // A `304` for a static file has no `Content-Type`.
    const contentType =
      headers.get('Content-Type') ??
      (notModified ? getMimeType(staticFile.filepath) : undefined);
    if (
      staticFile.data.byteLength < options.threshold ||
      headers.has('Content-Encoding') ||
      headers.has('Content-Range') ||
      !isCompressible(contentType) ||
      NO_TRANSFORM_REGEX.test(headers.get('Cache-Control') || '')
    ) {
      return;
    }
    // Set on the uncompressed variant and on `304` responses too, so caches
    // can tell the variants apart.
    appendVary(headers);
    const encoding = negotiateEncoding(
      c.req.header('Accept-Encoding'),
      options.encodings,
    );
    if (!encoding || !body || c.req.method === 'HEAD') {
      return;
    }
    const compressed = await compressFile(
      staticFile.filepath,
      staticFile.data,
      encoding,
    );
    body.cancel().catch(() => {});
    c.res = new Response(
      new Uint8Array(
        compressed.buffer as ArrayBuffer,
        compressed.byteOffset,
        compressed.byteLength,
      ),
      res,
    );
    // Hono copies the headers of the previous response when `c.res` is
    // replaced, so update them after the assignment.
    c.res.headers.set('Content-Length', String(compressed.byteLength));
    c.res.headers.set('Content-Encoding', encoding);
    weakenETag(c.res.headers);
  };
}

export type CompressPluginOptions = {
  /** Whether to compress when `server.compress` is not set. */
  enabledByDefault: boolean;
};

export const compressPlugin = ({
  enabledByDefault,
}: CompressPluginOptions): ServerPlugin => ({
  name: '@modern-js/plugin-compress',

  setup(api) {
    api.onPrepare(() => {
      // Resolved from the merged config, where `server/modern.server.ts`
      // takes precedence over `modern.config.ts`.
      const options = resolveCompressOptions(
        api.getServerConfig().server?.compress,
        enabledByDefault,
      );
      if (!options) {
        return;
      }
      const { middlewares } = api.getServerContext();

      middlewares.push({
        name: 'compress',
        handler: createCompressMiddleware(options),
        // Run outermost, so that it decides on the final headers of a file
        // and skips the files other middlewares have already encoded.
        order: 'pre',
      });
    });
  },
});
