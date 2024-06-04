import type { IncomingMessage } from 'http';
import { Readable } from 'stream';
import { SERVER_DIR, requireExistModule } from '@modern-js/utils';
import type {
  CacheControl,
  CacheOption,
  CacheOptionProvider,
  Container,
} from '@modern-js/types';
import { createMemoryStorage } from '@modern-js/runtime-utils/storer';
import { createTransformStream, getPathname } from '../../utils';
import type { SSRServerContext, ServerRender } from '../../../core/server';
import { createReadableStreamFromReadable } from '../../adapters/node/polyfills/stream';

interface CacheStruct {
  val: string;
  cursor: number;
}

interface CacheMod {
  customContainer?: Container;
  cacheOption?: CacheOption;
}

export type CacheStatus = 'hit' | 'stale' | 'expired' | 'miss';
export type CacheResult = {
  data: string | Readable | ReadableStream;
  status?: CacheStatus;
};

export class CacheManager {
  private container: Container<string, string>;

  constructor(container: Container<string, string>) {
    this.container = container;
  }

  async getCacheResult(
    req: Request,
    cacheControl: CacheControl,
    render: ServerRender,
    ssrContext: SSRServerContext,
  ): Promise<CacheResult> {
    const key = this.computedKey(req, cacheControl);

    const value = await this.container.get(key);
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
        this.processCache(key, render, ssrContext, ttl);

        return { data: cache.val, status: 'stale' };
      } else {
        // the cache is invalidate
        return this.processCache(key, render, ssrContext, ttl, 'expired');
      }
    } else {
      return this.processCache(key, render, ssrContext, ttl, 'miss');
    }
  }

  private async processCache(
    key: string,
    render: ServerRender,
    ssrContext: SSRServerContext,
    ttl: number,
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
      await this.container.set(key, JSON.stringify(cache), { ttl });
      return { data: renderResult, status };
    } else {
      const body =
        // TODO: remove node:stream, move it to ssr entry.
        renderResult instanceof Readable
          ? createReadableStreamFromReadable(renderResult)
          : renderResult;

      let html = '';
      const stream = createTransformStream(chunk => {
        html += chunk;

        return chunk;
      });

      const reader = body.getReader();
      const writer = stream.writable.getWriter();

      const push = () => {
        reader.read().then(({ done, value }) => {
          if (done) {
            const current = Date.now();
            const cache: CacheStruct = {
              val: html,
              cursor: current,
            };
            this.container.set(key, JSON.stringify(cache), { ttl });
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

  private computedKey(req: Request, cacheControl: CacheControl): string {
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
}

const CACHE_FILENAME = 'cache';

class ServerCache {
  customContainer?: Container;

  cacheOption?: CacheOption;

  private cacheManger?: CacheManager;

  async loadCacheMod(pwd: string = process.cwd()) {
    // only support node
    const path = await import('path').catch(() => {
      return {} as any;
    });
    // TODO: unify server config file.
    const serverCacheFilepath = path.resolve(pwd, SERVER_DIR, CACHE_FILENAME);
    const mod: CacheMod | undefined = requireExistModule(serverCacheFilepath, {
      interop: false,
    });

    this.cacheOption = mod?.cacheOption;
    if (this.cacheOption && !mod?.customContainer) {
      const cacheStorage = createMemoryStorage<string>('__ssr__cache');
      this.customContainer = cacheStorage;
    } else {
      this.customContainer = mod?.customContainer;
    }

    if (this.customContainer) {
      this.cacheManger = new CacheManager(this.customContainer);
    }
  }

  matchCacheControl(req?: IncomingMessage) {
    const { cacheOption } = this;

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
      return (
        typeof option === 'object' && option !== null && 'maxAge' in option
      );
    }
  }

  async getCache(
    req: Request,
    cacheControl: CacheControl,
    render: ServerRender,
    ssrContext: SSRServerContext,
  ): Promise<CacheResult> {
    if (this.cacheManger) {
      return this.cacheManger.getCacheResult(
        req,
        cacheControl,
        render,
        ssrContext,
      );
    } else {
      const renderResult = await render(ssrContext);
      return {
        data: renderResult,
      };
    }
  }
}

export const ssrCache = new ServerCache();
