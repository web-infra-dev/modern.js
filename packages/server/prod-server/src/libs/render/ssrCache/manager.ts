import { IncomingMessage } from 'http';
import { Readable, Transform } from 'stream';
import { Storage, store } from '@modern-js/runtime-utils/store';
import { RenderFunction } from '../type';
import { CacheControl } from './type';

interface CacheStruct {
  val: string;
  cursor: number;
}

export class CacheManager {
  private storage: Storage<string> = store.createContainer('custom');

  async getCacheResult(
    req: IncomingMessage,
    cacheControl: CacheControl,
    asyncRender: ReturnType<RenderFunction>,
  ): Promise<string | Readable> {
    const key = this.computedKey(req, cacheControl);
    const value = this.storage.get(key);

    if (value) {
      // has cache
      const cache: CacheStruct = JSON.parse(value);
      const interval = Date.now() - cache.cursor;

      const { maxAge, staleWhileRevalidate } = cacheControl;

      if (interval < maxAge) {
        // the cache is validate
        throw new Error('TODO: cache is validate');
      } else if (interval < staleWhileRevalidate + maxAge) {
        throw new Error('TODO: the cache is stale while revalidate');
        // the cache is stale while revalidate
      } else {
        // the cache is invalidate
        return this.processWithoutCache(key, asyncRender);
      }
    } else {
      return this.processWithoutCache(key, asyncRender);
    }
  }

  // private async processWithCache() {}

  private async processWithoutCache(
    key: string,
    asyncRender: ReturnType<RenderFunction>,
  ) {
    // no cache
    const renderResult = await asyncRender;

    if (typeof renderResult === 'string') {
      const current = Date.now();
      const cache: CacheStruct = {
        val: renderResult,
        cursor: current,
      };
      this.storage.set(key, JSON.stringify(cache));
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
        this.storage.set(key, JSON.stringify(cache));
      });

      return renderResult(stream);
    }
  }

  private computedKey(
    _req: IncomingMessage,
    _cacheControl: CacheControl,
  ): string {
    throw new Error('TODO');
  }
}
