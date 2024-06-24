import type { IncomingMessage } from 'http';
import type * as nodeStream from 'stream';
import type {
  CacheControl,
  CacheOption,
  CacheOptionProvider,
  Container,
} from '@modern-js/types';
import { createMemoryStorage } from '@modern-js/runtime-utils/storer';
import type * as streamPolyfills from '../../adapters/node/polyfills/stream';
import { createTransformStream, getPathname, getRuntimeEnv } from '../../utils';
import type { SSRServerContext, ServerRender } from '../../types';

interface CacheStruct {
  val: string;
  cursor: number;
}

export type CacheStatus = 'hit' | 'stale' | 'expired' | 'miss';
export type CacheResult = {
  data: string | nodeStream.Readable | ReadableStream;
  status?: CacheStatus;
};

async function processCache(
  key: string,
  render: ServerRender,
  ssrContext: SSRServerContext,
  ttl: number,
  container: Container,
  status?: CacheStatus,
) {
  const renderResult = await render(ssrContext);

  if (!renderResult) {
    return { data: '' };
  } else if (typeof renderResult === 'string') {
    const current = Date.now();
    const cache: CacheStruct = {
      val: renderResult,
      cursor: current,
    };
    await container.set(key, JSON.stringify(cache), { ttl });
    return { data: renderResult, status };
  } else {
    const { Readable } = await import('stream').catch(_ => ({
      Readable: undefined,
    }));

    const runtimeEnv = getRuntimeEnv();

    const streamModule = '../../adapters/node/polyfills/stream';
    const { createReadableStreamFromReadable } =
      runtimeEnv === 'node'
        ? ((await import(streamModule).catch(_ => ({
            createReadableStreamFromReadable: undefined,
          }))) as typeof streamPolyfills)
        : { createReadableStreamFromReadable: undefined };

    const body =
      // TODO: remove node:stream, move it to ssr entry.
      Readable && renderResult instanceof Readable
        ? createReadableStreamFromReadable?.(renderResult)
        : (renderResult as ReadableStream);

    let html = '';
    const stream = createTransformStream(chunk => {
      html += chunk;

      return chunk;
    });

    const reader = body!.getReader();
    const writer = stream.writable.getWriter();

    const push = () => {
      reader.read().then(({ done, value }) => {
        if (done) {
          const current = Date.now();
          const cache: CacheStruct = {
            val: html,
            cursor: current,
          };
          container.set(key, JSON.stringify(cache), { ttl });
          writer.close();
          return;
        }

        writer.write(value);
        push();
      });
    };

    push();

    return {
      data: stream.readable,
      status,
    };
  }
}

const CACHE_NAMESPACE = '__ssr__cache';

const storage = createMemoryStorage<string>(CACHE_NAMESPACE);

function computedKey(req: Request, cacheControl: CacheControl): string {
  const pathname = getPathname(req);
  const { customKey } = cacheControl;

  // we use `pathname.replace(/\/+$/, '')` to remove the '/' with end.
  // examples:
  // pathname1: '/api', pathname2: '/api/'
  // pathname1 as same as pathname2
  const defaultKey = pathname.replace(/.+\/+$/, '');

  if (customKey) {
    if (typeof customKey === 'string') {
      return customKey;
    } else {
      return customKey(defaultKey);
    }
  } else {
    return defaultKey;
  }
}

export function matchCacheControl(
  cacheOption?: CacheOption,
  req?: IncomingMessage,
): CacheControl | Promise<CacheControl> | undefined {
  if (!cacheOption || !req) {
    return undefined;
  } else if (isCacheControl(cacheOption)) {
    return cacheOption;
  } else if (isCacheOptionProvider(cacheOption)) {
    return cacheOption(req);
  } else {
    const url = req.url!;
    const options = Object.entries(cacheOption);

    for (const [key, option] of options) {
      if (key === '*' || new RegExp(key).test(url)) {
        if (typeof option === 'function') {
          return option(req);
        } else {
          return option;
        }
      }
    }

    return undefined;
  }

  function isCacheOptionProvider(
    option: CacheOption,
  ): option is CacheOptionProvider {
    return typeof option === 'function';
  }

  function isCacheControl(option: CacheOption): option is CacheControl {
    return typeof option === 'object' && option !== null && 'maxAge' in option;
  }
}

export interface GetCacheResultOptions {
  cacheControl: CacheControl;
  render: ServerRender;
  ssrContext: SSRServerContext;
  container?: Container;
}

export async function getCacheResult(
  request: Request,
  options: GetCacheResultOptions,
): Promise<CacheResult> {
  const { cacheControl, render, ssrContext, container = storage } = options;

  const key = computedKey(request, cacheControl);

  const value = await container.get(key);
  const { maxAge, staleWhileRevalidate } = cacheControl;
  const ttl = maxAge + staleWhileRevalidate;

  if (value) {
    // has cache
    const cache: CacheStruct = JSON.parse(value);
    const interval = Date.now() - cache.cursor;

    if (interval <= maxAge) {
      // the cache is validate
      return {
        data: cache.val,
        status: 'hit',
      };
    } else if (interval <= staleWhileRevalidate + maxAge) {
      // the cache is stale while revalidate

      // we shouldn't await this promise.
      processCache(key, render, ssrContext, ttl, container);

      return { data: cache.val, status: 'stale' };
    } else {
      // the cache is invalidate
      return processCache(key, render, ssrContext, ttl, container, 'expired');
    }
  } else {
    return processCache(key, render, ssrContext, ttl, container, 'miss');
  }
}
