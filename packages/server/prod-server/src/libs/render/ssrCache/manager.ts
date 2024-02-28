import { IncomingMessage } from 'http';
import { Readable, Transform } from 'stream';
import { CacheControl, Container } from '@modern-js/types';
import { RenderFunction, SSRServerContext } from '../type';

type CacheStatus = 'hit' | 'stale' | 'expired' | 'miss';
export type CacheResult = {
  data: string | Readable;
  status?: CacheStatus;
};

interface CacheStruct {
  val: string;
  cursor: number;
}

export class CacheManager {
  private container: Container<string, string>;

  constructor(container: Container<string, string>) {
    this.container = container;
  }

  async getCacheResult(
    req: IncomingMessage,
    cacheControl: CacheControl,
    render: RenderFunction,
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
        return { data: cache.val, status: 'hit' };
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
    render: RenderFunction,
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
      let html = '';
      const stream = new Transform({
        write(chunk, _, callback) {
          html += chunk.toString();
          this.push(chunk);
          callback();
        },
      });

      stream.on('close', () => {
        const current = Date.now();
        const cache: CacheStruct = {
          val: html,
          cursor: current,
        };
        this.container.set(key, JSON.stringify(cache), { ttl });
      });

      const readable = await renderResult(stream);

      return {
        data: readable,
        status,
      };
    }
  }

  private computedKey(
    req: IncomingMessage,
    cacheControl: CacheControl,
  ): string {
    const { url } = req;
    const [pathname] = url!.split('?');
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
