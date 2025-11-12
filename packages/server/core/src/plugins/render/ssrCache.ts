import { createMemoryStorage } from '@modern-js/runtime-utils/storer';
import type {
  CacheControl,
  CacheOption,
  CacheOptionProvider,
  Container,
} from '@modern-js/types';
import type { NodeRequest } from '@modern-js/types/server';
import { X_RENDER_CACHE } from '../../constants';
import type {
  RequestHandler,
  RequestHandlerOptions,
} from '../../types/requestHandler';
import { createTransformStream, getPathname } from '../../utils';

interface CacheStruct {
  val: string;
  cursor: number;
}

const removeTailSlash = (s: string): string => s.replace(/\/+$/, '');
const ZERO_RENDER_LEVEL = /"renderLevel":0/;
const NO_SSR_CACHE = /<meta\s+[^>]*name=["']no-ssr-cache["'][^>]*>/i;

export type CacheStatus = 'hit' | 'stale' | 'expired' | 'miss';

async function processCache({
  request,
  key,
  requestHandler,
  requestHandlerOptions,
  ttl,
  container,
  cacheStatus,
}: {
  request: Request;
  key: string;
  requestHandler: RequestHandler;
  requestHandlerOptions: RequestHandlerOptions;
  ttl: number;
  container: Container;
  cacheStatus?: CacheStatus;
}) {
  const response = await requestHandler(request, requestHandlerOptions);
  const { onError } = requestHandlerOptions;

  // Do not cache responses with certain status codes
  const nonCacheableStatusCodes = [204, 305, 404, 405, 500, 501, 502, 503, 504];
  if (nonCacheableStatusCodes.includes(response.status)) {
    return response;
  }

  const decoder: TextDecoder = new TextDecoder();

  if (response.body) {
    const stream = createTransformStream();

    const reader = response.body.getReader();
    const writer = stream.writable.getWriter();

    let html = '';
    const push = () =>
      reader.read().then(({ done, value }) => {
        if (done) {
          const match = ZERO_RENDER_LEVEL.test(html) || NO_SSR_CACHE.test(html);
          // case 1: We should not cache the html, if we can match the html is downgrading.
          // case 2: We should not cache the html, if the user's code contains <NoSSRCache>.
          if (match) {
            writer.close();
            return;
          }
          const current = Date.now();
          const cache: CacheStruct = {
            val: html,
            cursor: current,
          };

          container.set(key, JSON.stringify(cache), { ttl }).catch(() => {
            if (onError) {
              onError(
                `[render-cache] set cache failed, key: ${key}, value: ${JSON.stringify(
                  cache,
                )}`,
              );
            } else {
              console.error(
                `[render-cache] set cache failed, key: ${key}, value: ${JSON.stringify(
                  cache,
                )}`,
              );
            }
          });

          writer.close();
          return;
        }

        const content = decoder.decode(value);
        html += content;

        writer.write(value);
        push();
      });

    push();

    cacheStatus && response.headers.set(X_RENDER_CACHE, cacheStatus);

    return new Response(stream.readable, {
      status: response.status,
      headers: response.headers,
    });
  }

  return response;
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
  const defaultKey = pathname === '/' ? pathname : removeTailSlash(pathname);

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

type MaybeAsync<T> = Promise<T> | T;

/**
 * Check if a request should be processed through cache logic
 */
export function shouldUseCache(request: Request): boolean {
  const url = new URL(request.url);
  const hasRSCAction = request.headers.has('x-rsc-action');
  const hasRSCTree = request.headers.has('x-rsc-tree');
  const hasLoaderQuery = url.searchParams.has('__loader');

  // Skip cache for RSC requests or loader requests
  return !(hasRSCAction || hasRSCTree || hasLoaderQuery);
}

export function matchCacheControl(
  cacheOption?: CacheOption,
  // TODO: remove nodeReq
  req?: NodeRequest,
): MaybeAsync<CacheControl | undefined | false> {
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
  requestHandler: RequestHandler;
  requestHandlerOptions: RequestHandlerOptions;
  container?: Container;
}

export async function getCacheResult(
  request: Request,
  options: GetCacheResultOptions,
): Promise<Response> {
  const {
    cacheControl,
    container = storage,
    requestHandler,
    requestHandlerOptions,
  } = options;
  const { onError } = requestHandlerOptions;

  const key = computedKey(request, cacheControl);

  let value: string | undefined;
  try {
    value = await container.get(key);
  } catch (_) {
    if (onError) {
      onError(`[render-cache] get cache failed, key: ${key}`);
    } else {
      console.error(`[render-cache] get cache failed, key: ${key}`);
    }
    value = undefined;
  }
  const { maxAge, staleWhileRevalidate } = cacheControl;
  const ttl = maxAge + staleWhileRevalidate;

  if (value) {
    // has cache
    const cache: CacheStruct = JSON.parse(value);
    const interval = Date.now() - cache.cursor;

    if (interval <= maxAge) {
      // the cache is validate
      const cacheStatus: CacheStatus = 'hit';
      return new Response(cache.val, {
        headers: {
          [X_RENDER_CACHE]: cacheStatus,
        },
      });
    } else if (interval <= staleWhileRevalidate + maxAge) {
      // the cache is stale while revalidate

      // we shouldn't await this promise.
      processCache({
        key,
        request,
        requestHandler,
        requestHandlerOptions,
        ttl,
        container,
      }).then(async response => {
        // For cache the readableStream, we need confirm the response is consume,
        await response.text();
      });

      const cacheStatus: CacheStatus = 'stale';
      return new Response(cache.val, {
        headers: {
          [X_RENDER_CACHE]: cacheStatus,
        },
      });
    } else {
      // the cache is invalidate
      return processCache({
        key,
        request,
        requestHandler,
        requestHandlerOptions,
        ttl,
        container,
        cacheStatus: 'expired',
      });
    }
  } else {
    return processCache({
      key,
      request,
      requestHandler,
      requestHandlerOptions,
      ttl,
      container,
      cacheStatus: 'miss',
    });
  }
}
