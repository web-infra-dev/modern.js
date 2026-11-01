import zlib from 'node:zlib';
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
        zlib.brotliCompress(data, STATIC_BROTLI_OPTIONS, callback);
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

// Bodies of static file responses, with the file they were read from. The
// compress middleware decides on the final response headers, so a header set
// by any middleware is respected, and then serves the cached compressed
// content of the file instead of compressing the body again.
const staticFileBodies = new WeakMap<
  ReadableStream,
  { filepath: string; data: Buffer }
>();

/**
 * Mark a response as the content of a static file. Returns the response.
 */
export function registerStaticFile(
  res: Response,
  filepath: string,
  data: Buffer,
) {
  if (res.body) {
    staticFileBodies.set(res.body, { filepath, data });
  }
  return res;
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
        try {
          if (output.length > 0) {
            controller.enqueue(
              output.length === 1 ? output[0] : Buffer.concat(output),
            );
            output = [];
          }
          resolve();
        } catch (error) {
          // The response was cancelled, e.g. the client disconnected while
          // the chunk was being compressed. Throwing here would escape the
          // zlib callback and crash the process.
          zstream.destroy();
          reject(error);
        }
      });
    });

  // `cancel` is part of the Streams standard, but not of TypeScript's
  // `Transformer` type yet.
  const transformer: Transformer<Uint8Array, Uint8Array> & {
    cancel?: (reason: unknown) => void;
  } = {
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
    // Called when the client disconnects or the source body errors while no
    // chunk is being compressed, so the native zlib stream is released.
    cancel() {
      zstream.destroy();
    },
  };
  return new TransformStream(transformer);
}

const NOT_READY = Symbol('not ready');

const nextTick = () =>
  new Promise<typeof NOT_READY>(resolve => setImmediate(resolve, NOT_READY));

/**
 * Read the chunks of `body` that are already available, until `limit` bytes.
 * Responses like `c.json()` have no `Content-Length`, so this tells whether
 * they are below the threshold, without waiting for the next chunk of a
 * streaming response.
 */
async function readAhead(body: ReadableStream<Uint8Array>, limit: number) {
  const reader = body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  let done = false;
  let pending = reader.read();
  pending.catch(() => {});
  while (size < limit) {
    const result = await Promise.race([pending, nextTick()]);
    if (result === NOT_READY) {
      break;
    }
    if (result.done) {
      done = true;
      break;
    }
    chunks.push(result.value);
    size += result.value.byteLength;
    pending = reader.read();
    pending.catch(() => {});
  }

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      for (const chunk of chunks) {
        controller.enqueue(chunk);
      }
      if (done) {
        controller.close();
      }
    },
    async pull(controller) {
      const result = await pending;
      if (result.done) {
        controller.close();
      } else {
        controller.enqueue(result.value);
        pending = reader.read();
        pending.catch(() => {});
      }
    },
    cancel(reason) {
      return reader.cancel(reason);
    },
  });
  return { stream, size, done };
}

export function createCompressMiddleware(
  options: ResolvedCompressOptions,
): Middleware {
  return async (c, next) => {
    await next();

    const { res } = c;
    const { headers, body: originalBody } = res;
    if (
      !originalBody ||
      c.req.method === 'HEAD' ||
      headers.has('Content-Encoding') ||
      headers.has('Content-Range') ||
      !isCompressible(headers.get('Content-Type')) ||
      NO_TRANSFORM_REGEX.test(headers.get('Cache-Control') || '')
    ) {
      return;
    }
    let body: ReadableStream<Uint8Array> = originalBody;
    const contentLength = headers.get('Content-Length');
    if (contentLength !== null) {
      if (Number(contentLength) < options.threshold) {
        return;
      }
    } else {
      const ahead = await readAhead(body, options.threshold);
      if (ahead.done && ahead.size < options.threshold) {
        c.res = new Response(ahead.stream, res);
        c.res.headers.set('Content-Length', String(ahead.size));
        return;
      }
      ({ stream: body } = ahead);
    }

    const encoding = negotiateEncoding(
      c.req.header('Accept-Encoding'),
      options.encodings,
    );
    const staticFile = staticFileBodies.get(originalBody);
    if (encoding && staticFile) {
      const compressed = await compressFile(
        staticFile.filepath,
        staticFile.data,
        encoding,
      );
      originalBody.cancel().catch(() => {});
      c.res = new Response(
        new Uint8Array(
          compressed.buffer as ArrayBuffer,
          compressed.byteOffset,
          compressed.byteLength,
        ),
        res,
      );
      c.res.headers.set('Content-Length', String(compressed.byteLength));
      c.res.headers.set('Content-Encoding', encoding);
    } else if (encoding) {
      c.res = new Response(
        body.pipeThrough(createCompressStream(encoding)),
        res,
      );
      // Hono copies the headers of the previous response when `c.res` is
      // replaced, so update them after the assignment.
      c.res.headers.delete('Content-Length');
      c.res.headers.set('Content-Encoding', encoding);
    } else if (body !== originalBody) {
      // The original body has been read ahead.
      c.res = new Response(body, res);
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
