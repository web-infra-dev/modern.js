/* eslint-disable @typescript-eslint/member-ordering */
/* eslint-disable no-lone-blocks */
import crypto from 'crypto';
import { IncomingHttpHeaders } from 'http';
import url from 'url';
import LRUCache from 'lru-cache';
import { mime } from '@modern-js/utils';
import {
  cacheAddition,
  connectFactor,
  fname,
  maybeSync,
  namespaceHash,
  valueFactory,
  withCoalescedInvoke,
} from './util';
import { createPageCaches } from './page-caches';
import {
  PageCache,
  PageCachesInterface,
  CacheContent,
  CacheManagerOptions,
  CacheResult,
  CacheContext,
  CacheConfig,
} from './type';

const MAX_CACHE_EACH_REQ = Number(process.env.ROUTE_CACHE_LIMIT) || 10;
const MAX_SIZE_EACH_CLUSTER = Number(process.env.CLUSTER_CACHE_LIMIT) || 100;
const BASE_LEVEL = 0;
const QUERY_LEVEL = 1;
const HEADER_LEVEL = 2;
const QUERY_HEADER_LEVEL = 3;

class CacheManager {
  cache: LRUCache<string, CacheContent>;

  cacheOptions: CacheManagerOptions;

  constructor(cacheOptions: CacheManagerOptions) {
    this.cacheOptions = cacheOptions;

    this.cache = new LRUCache({
      max: Math.min(MAX_SIZE_EACH_CLUSTER, 600) * 1024 * 1024, // 默认存 100M，最大 600M
      length(n: CacheContent) {
        const len = n.caches
          .keys()
          .reduce((total, cur) => total + (n.caches.peek(cur)?.size || 0), 1);
        return len;
      },
    });
  }

  private md5(content: string) {
    const md5 = crypto.createHash('md5');
    return md5.update(content).digest('hex');
  }

  private generateRequestKey(context: CacheContext) {
    const { pathname, entry } = context;
    return this.md5(`${pathname}_${entry}`);
  }

  private replaceValue(value: string, matcher: Record<string, string>) {
    let final = value;
    Object.keys(matcher).some(replacer => {
      const reg = new RegExp(matcher[replacer]);
      if (reg.test(value)) {
        final = replacer;
        return true;
      }
      return false;
    });
    return final;
  }

  private factor(
    keys: string[],
    obj: url.URLSearchParams | IncomingHttpHeaders,
    matches: Record<string, Record<string, string>> = {},
  ) {
    keys.sort();
    const getValue = valueFactory(obj);

    const factorAry = keys.reduce((ary: string[], key: string) => {
      let value: string = getValue(key) || '';
      const matcher = matches[key];
      if (matcher) {
        value = this.replaceValue(value, matcher);
      }

      return ary.concat([key, value]);
    }, []);
    return factorAry.join(',');
  }

  private queryFactor(context: CacheContext, data: CacheContent) {
    const queryKeys = data.includes?.query;
    const queryMatches = data.matches?.query;
    if (!queryKeys || queryKeys.length === 0) {
      return null;
    }
    const requestQuery: any = context.query;
    const queryFactor = this.factor(queryKeys, requestQuery, queryMatches);
    return queryFactor;
  }

  private headerFactor(context: CacheContext, data: CacheContent) {
    const headerKeys = data.includes?.header;
    const headerMatches = data.matches?.header;
    if (!headerKeys || headerKeys.length === 0) {
      return null;
    }
    const requestHeader: any = context.headers;
    const headerFactor = this.factor(headerKeys, requestHeader, headerMatches);
    return headerFactor;
  }

  private readonly find: any = (() => {
    {
      // eslint-disable-next-line consistent-this,@typescript-eslint/no-this-alias
      const _this = this;
      return {
        [fname(BASE_LEVEL)](
          context: CacheContext,
          cacheKey: string,
          // data: CacheContent,
        ): string | null {
          return _this.md5(cacheKey);
        },
        [fname(QUERY_LEVEL)](
          context: CacheContext,
          cacheKey: string,
          data: CacheContent,
        ): string | null {
          const queryFactor = _this.queryFactor(context, data);
          if (!queryFactor) {
            return null;
          }
          return _this.md5(connectFactor(cacheKey, queryFactor));
        },
        [fname(HEADER_LEVEL)](
          context: CacheContext,
          cacheKey: string,
          data: CacheContent,
        ): string | null {
          const headerFactor = _this.headerFactor(context, data);
          if (!headerFactor) {
            return null;
          }
          return _this.md5(connectFactor(cacheKey, headerFactor));
        },
        [fname(QUERY_HEADER_LEVEL)](
          context: CacheContext,
          cacheKey: string,
          data: CacheContent,
        ): string | null {
          const queryFactor = _this.queryFactor(context, data);
          const headerFactor = _this.headerFactor(context, data);
          if (!queryFactor || !headerFactor) {
            return null;
          }
          return _this.md5(connectFactor(cacheKey, headerFactor, queryFactor));
        },
      };
    }
  })();

  private async best(
    context: CacheContext,
    cacheKey: string,
    data: CacheContent,
  ): Promise<PageCache | null> {
    const { level } = data;
    const cacheHash = this.find[fname(level)](context, cacheKey, data);
    if (!cacheHash) {
      return null;
    }
    return data.caches.get(cacheHash);
  }

  private createCacheContent(
    config: CacheConfig,
    caches: PageCachesInterface,
  ): CacheContent {
    return {
      level: config.level,
      interval: config.interval,
      includes: config.includes || null,
      limit: config.staleLimit,
      matches: config.matches || null,
      caches,
    };
  }

  async get(context: CacheContext): Promise<CacheResult | null> {
    const cacheKey = this.generateRequestKey(context);
    const data = this.cache.get(cacheKey);

    // no cache key matched
    if (!data) {
      return null;
    }

    const dest = await this.best(context, cacheKey, data);
    // no cache for current page with current config
    if (!dest) {
      return null;
    }

    const { expireTime, limitTime, html, cacheHash } = dest;
    const isStale = Date.now() - expireTime > 0;
    const isGarbage = limitTime ? Date.now() - limitTime > 0 : false;

    return {
      content: html || '',
      contentType: mime.contentType('html') as string,
      isStale,
      isGarbage,
      hash: cacheHash,
    };
  }

  async set(
    context: CacheContext,
    html: string,
    cacheConfig: CacheConfig,
    sync = false,
  ) {
    if (!cacheConfig) {
      return false;
    }

    // each version with route is a separate cache
    const cacheKey = this.generateRequestKey(context);
    let data = this.cache.get(cacheKey);
    if (!data) {
      const caches = await createPageCaches(MAX_CACHE_EACH_REQ);
      data = this.createCacheContent(cacheConfig, caches);
    }

    const cacheHash = this.find[fname(cacheConfig.level)](
      context,
      cacheKey,
      data,
    );

    // if cacheHash is null, maybe level not match meta key, do not cache
    if (!cacheHash) {
      return false;
    }

    const cacheSyncOrAsync = async () => {
      const next = data as CacheContent;
      const limit = cacheConfig.staleLimit;

      const storeHTML = cacheAddition(html, cacheHash);
      const size = storeHTML.length;
      await next.caches.set(cacheHash, {
        expireTime: Date.now() + cacheConfig.interval * 1000,
        limitTime: typeof limit === 'number' ? Date.now() + limit * 1000 : null,
        cacheHash,
        html: storeHTML,
        size,
      });
      this.cache.set(cacheKey, next);
      return true;
    };

    // cache set is async, each hash is cached only once at the same time
    const doCache = withCoalescedInvoke(cacheSyncOrAsync).bind(
      null,
      namespaceHash('stream', cacheHash),
      [],
    );
    return maybeSync(doCache)(sync);
  }

  async del(context: CacheContext, cacheHash: string) {
    const cacheKey = this.generateRequestKey(context);
    const data = this.cache.get(cacheKey);
    data?.caches.del(cacheHash);
  }
}

let manager: CacheManager;
export function createCache() {
  if (manager) {
    return manager;
  }

  manager = new CacheManager({ max: 0 });
  return manager;
}

export function destroyCache() {
  manager = null!;
}
/* eslint-enable no-lone-blocks */
/* eslint-enable @typescript-eslint/member-ordering */
