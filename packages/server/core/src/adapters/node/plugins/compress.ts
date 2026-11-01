import zlib from 'node:zlib';
import type { Context } from 'hono';
import { COMPRESSIBLE_CONTENT_TYPE_REGEX } from 'hono/utils/compress';
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

// Brotli quality 11 is too slow for responses compressed on every request,
// quality 5 compresses about as fast as gzip level 6 with a smaller output.
const STREAM_BROTLI_OPTIONS: zlib.BrotliOptions = {
  params: { [zlib.constants.BROTLI_PARAM_QUALITY]: 5 },
};

// Static files are compressed once and then served from memory, quality 11
// would delay the first request of a large file by about a second.
const STATIC_BROTLI_OPTIONS: zlib.BrotliOptions = {
  params: { [zlib.constants.BROTLI_PARAM_QUALITY]: 9 },
};

const GZIP_OPTIONS: zlib.ZlibOptions = { level: 6 };

const NO_TRANSFORM_REGEX = /(?:^|,)\s*no-transform\s*(?:,|$)/i;

/**
 * Resolve `server.compress`. Compression is only applied by the production
 * server. It is enabled by default for the Node.js server, and must be
 * enabled explicitly for other runtimes, which usually compress at the edge.
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
  // Excludes server-sent events, they must reach the client one at a time.
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
    const [name, ...params] = part.trim().toLowerCase().split(';');
    if (!name) {
      continue;
    }
    let quality = 1;
    for (const param of params) {
      const [key, value] = param.trim().split('=');
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

type CompressedFile = {
  source: Buffer;
  results: Partial<Record<CompressEncoding, Promise<Buffer>>>;
};

// Keyed by file path. Concurrent first requests may read a file into
// different buffers, so the content is compared when the buffer changes,
// and a changed file is compressed again.
const compressedFiles = new Map<string, CompressedFile>();

function compressFile(
  filepath: string,
  data: Buffer,
  encoding: CompressEncoding,
) {
  let file = compressedFiles.get(filepath);
  if (!file || (file.source !== data && !file.source.equals(data))) {
    file = { source: data, results: {} };
    compressedFiles.set(filepath, file);
  }
  // Keep the buffer that `fileReader` caches now, so the next lookup is an
  // identity check.
  file.source = data;
  const entry = file.results;
  let compressed = entry[encoding];
  if (!compressed) {
    compressed = new Promise<Buffer>((resolve, reject) => {
      const callback = (error: Error | null, result: Buffer) =>
        error ? reject(error) : resolve(result);
      if (encoding === 'br') {
        zlib.brotliCompress(data, STATIC_BROTLI_OPTIONS, callback);
      } else {
        zlib.gzip(data, GZIP_OPTIONS, callback);
      }
    });
    entry[encoding] = compressed;
    compressed.catch(() => {
      delete entry[encoding];
    });
  }
  return compressed;
}

/**
 * Compress the content of a static file for the current request, the result
 * is cached. Sets `Content-Encoding` and `Vary`, so the compress middleware
 * leaves the response as it is.
 */
export async function compressStaticFile(
  c: Context,
  filepath: string,
  data: Buffer,
  contentType: string | undefined,
  options?: ResolvedCompressOptions,
): Promise<Buffer> {
  if (
    !options ||
    data.byteLength < options.threshold ||
    !isCompressible(contentType)
  ) {
    return data;
  }
  c.header('Vary', 'Accept-Encoding', { append: true });
  const encoding = negotiateEncoding(
    c.req.header('Accept-Encoding'),
    options.encodings,
  );
  if (!encoding) {
    return data;
  }
  const compressed = await compressFile(filepath, data, encoding);
  c.header('Content-Encoding', encoding);
  return compressed;
}

/**
 * Flush after every chunk, so a streaming response (e.g. streaming SSR)
 * reaches the client as soon as each chunk is rendered.
 */
function createCompressStream(
  encoding: CompressEncoding,
): TransformStream<Uint8Array, Uint8Array> {
  const zstream =
    encoding === 'br'
      ? zlib.createBrotliCompress(STREAM_BROTLI_OPTIONS)
      : zlib.createGzip(GZIP_OPTIONS);
  let output: Buffer[] = [];
  let fail: ((error: Error) => void) | undefined;
  zstream.on('data', (chunk: Buffer) => output.push(chunk));
  zstream.on('error', error => fail?.(error));
  // Enqueue the output of each operation as one chunk, so that every input
  // chunk results in a single write to the response.
  const run = (
    controller: TransformStreamDefaultController<Uint8Array>,
    operation: (done: () => void) => void,
  ) =>
    new Promise<void>((resolve, reject) => {
      fail = reject;
      operation(() => {
        if (output.length > 0) {
          controller.enqueue(
            output.length === 1 ? output[0] : Buffer.concat(output),
          );
          output = [];
        }
        resolve();
      });
    });

  return new TransformStream({
    transform(chunk, controller) {
      return run(controller, done => {
        zstream.write(chunk);
        zstream.flush(done);
      });
    },
    flush(controller) {
      return run(controller, done => {
        zstream.once('end', done);
        zstream.end();
      });
    },
  });
}

export function createCompressMiddleware(
  options: ResolvedCompressOptions,
): Middleware {
  return async (c, next) => {
    await next();

    const { res } = c;
    const { headers } = res;
    if (
      !res.body ||
      c.req.method === 'HEAD' ||
      headers.has('Content-Encoding') ||
      headers.has('Content-Range') ||
      !isCompressible(headers.get('Content-Type')) ||
      NO_TRANSFORM_REGEX.test(headers.get('Cache-Control') || '')
    ) {
      return;
    }
    const contentLength = headers.get('Content-Length');
    if (contentLength !== null && Number(contentLength) < options.threshold) {
      return;
    }

    const encoding = negotiateEncoding(
      c.req.header('Accept-Encoding'),
      options.encodings,
    );
    if (encoding) {
      c.res = new Response(
        res.body.pipeThrough(createCompressStream(encoding)),
        res,
      );
      // Hono copies the headers of the previous response when `c.res` is
      // replaced, so update them after the assignment.
      c.res.headers.delete('Content-Length');
      c.res.headers.set('Content-Encoding', encoding);
    }
    appendVary(c.res.headers);
  };
}

export const compressPlugin = (
  options?: ResolvedCompressOptions,
): ServerPlugin => ({
  name: '@modern-js/plugin-compress',

  setup(api) {
    if (!options) {
      return;
    }
    api.onPrepare(() => {
      const { middlewares } = api.getServerContext();

      middlewares.push({
        name: 'compress',
        handler: createCompressMiddleware(options),
        // Run outermost, so that it compresses the responses of all other
        // middlewares and skips the ones they have already encoded.
        order: 'pre',
      });
    });
  },
});
