import { IncomingMessage } from 'http';
import { Readable, Transform } from 'stream';
import { AsyncContainter, CacheControl, Container } from '@modern-js/types';
import { RenderFunction, SSRServerContext } from '../type';

interface CacheStruct {
  val: string;
  cursor: number;
}

export class CacheManager {
  private containter:
    | Container<string, string>
    | AsyncContainter<string, string>;

  constructor(
    containter: Container<string, string> | AsyncContainter<string, string>,
  ) {
    this.containter = containter;
  }

  async getCacheResult(
    req: IncomingMessage,
    cacheControl: CacheControl,
    render: RenderFunction,
    ssrContext: SSRServerContext,
  ): Promise<string | Readable> {
    const key = this.computedKey(req, cacheControl);

    // support user handle the by themself.
    cacheControl.cacheHandler?.(key);

    const value = await this.containter.get(key);
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
    render: RenderFunction,
    ssrContext: SSRServerContext,
    ttl: number,
  ) {
    const renderResult = await render(ssrContext);

    if (typeof renderResult === 'string') {
      const current = Date.now();
      const cache: CacheStruct = {
        val: renderResult,
        cursor: current,
      };
      await this.containter.set(key, JSON.stringify(cache), { ttl });
      return renderResult;
    } else {
      let html: string;
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
        this.containter.set(key, JSON.stringify(cache), { ttl });
      });

      return renderResult(stream);
    }
  }

  private computedKey(
    req: IncomingMessage,
    cacheControl: CacheControl,
  ): string {
    const { url, headers } = req;
    const [pathname, query] = url!.split('?');

    // we use `pathname.replace(/\/+$/, '')` to remove the '/' with end.
    // examples:
    // pathname1: '/api', pathname2: '/api/'
    // pathname1 as same as pathname2
    const keySlice: string[] = [pathname.replace(/.+\/+$/, '')];
    const { controlRanges, customKey } = cacheControl;

    if (controlRanges?.includes('query')) {
      keySlice.push(query);
    }

    if (controlRanges?.includes('header')) {
      keySlice.push(JSON.stringify(headers));
    }

    if (customKey) {
      keySlice.push(customKey);
    }

    return keySlice.join(';');
  }
}
