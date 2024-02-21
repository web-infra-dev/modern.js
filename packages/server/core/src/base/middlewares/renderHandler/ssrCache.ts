import path from 'path';
import { IncomingMessage } from 'http';
import { Readable } from 'stream';
import { SERVER_DIR, requireExistModule } from '@modern-js/utils';
import type {
  CacheControl,
  CacheOption,
  CacheOptionProvider,
  Container,
} from '@modern-js/types';
import { createMemoryStorage } from '@modern-js/runtime-utils/storer';
import type { SSRServerContext, ServerRender } from '../../../core/server';
import { createReadableStreamFromReadable } from '../../adapters/node/polyfills/stream';
import { createTransformStream } from '../../libs/utils';
import { getPathname } from '../../libs/request';

interface CacheStruct {
  val: string;
  cursor: number;
}

interface CacheMod {
  customContainer?: Container;
  cacheOption?: CacheOption;
}

class CacheManager {
  private container: Container<string, string>;

  constructor(container: Container<string, string>) {
    this.container = container;
  }

  async getCacheResult(
    req: Request,
    cacheControl: CacheControl,
    render: ServerRender,
    ssrContext: SSRServerContext,
  ): Promise<string | ReadableStream> {
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
        return cache.val;
      } else if (interval <= staleWhileRevalidate + maxAge) {
        // the cache is stale while revalidate

        // we shouldn't await this promise.
        this.processCache(key, render, ssrContext, ttl);

        return cache.val;
      } else {
        // the cache is invalidate
        return this.processCache(key, render, ssrContext, ttl);
      }
    } else {
      return this.processCache(key, render, ssrContext, ttl);
    }
  }

  private async processCache(
    key: string,
    render: ServerRender,
    ssrContext: SSRServerContext,
    ttl: number,
  ) {
    const renderResult = await render(ssrContext);

    if (!renderResult) {
      return '';
    } else if (typeof renderResult === 'string') {
      const current = Date.now();
      const cache: CacheStruct = {
        val: renderResult,
        cursor: current,
      };
      await this.container.set(key, JSON.stringify(cache), { ttl });
      return renderResult;
    } else {
      const body =
        renderResult instanceof Readable
          ? createReadableStreamFromReadable(renderResult)
          : renderResult;

      let html = '';
      const stream = createTransformStream(chunk => {
        html += chunk;

        return chunk;
      });
      stream.readable.getReader().closed.then(() => {
        const current = Date.now();
        const cache: CacheStruct = {
          val: html,
          cursor: current,
        };
        this.container.set(key, JSON.stringify(cache), { ttl });
      });

      body.pipeThrough(stream);

      return stream.readable;
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

  loadCacheMod(pwd: string = process.cwd()) {
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

  getCache(
    req: Request,
    cacheControl: CacheControl,
    render: ServerRender,
    ssrContext: SSRServerContext,
  ) {
    if (this.cacheManger) {
      return this.cacheManger.getCacheResult(
        req,
        cacheControl,
        render,
        ssrContext,
      );
    } else {
      return render(ssrContext);
    }
  }
}

export const ssrCache = new ServerCache();
