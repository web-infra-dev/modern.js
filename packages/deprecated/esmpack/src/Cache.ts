import { AsyncParallelHook, AsyncSeriesBailHook } from 'tapable';

interface CacheHooks {
  get: AsyncSeriesBailHook<[string, string | null], string | undefined>;
  store: AsyncParallelHook<[string, string | null, string]>;
}

class Cache {
  public static STAGE_MEMORY: number = -10;
  public static STAGE_DEFAULT: number = 0;
  public static STAGE_DISK: number = 10;
  public static STAGE_NETWORK: number = 20;
  public hooks: CacheHooks = Object.freeze({
    get: new AsyncSeriesBailHook<[string, string | null], string | undefined>([
      'identifier',
      'etag',
    ]),
    store: new AsyncParallelHook<[string, string | null, string]>([
      'identifier',
      'etag',
      'data',
    ]),
  });

  async get(id: string, etag: string | null) {
    const ret = await this.hooks.get.promise(id, etag);
    return ret;
  }

  async store(id: string, etag: string | null, data: string) {
    await this.hooks.store.promise(id, etag, data);
  }
}

export { Cache };
