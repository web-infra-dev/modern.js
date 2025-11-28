import Redis from 'ioredis-mock';
import {
  CacheTime,
  type Container,
  cache,
  clearStore,
  configureCache,
  revalidateTag,
  withRequestCache,
} from '../../src/universal/cache';

class MockRequest {
  url: string;
  method: string;
  constructor(url = 'http://example.com', method = 'GET') {
    this.url = url;
    this.method = method;
  }
}

class RedisContainer implements Container {
  private redis: InstanceType<typeof Redis>;

  private operations: string[] = [];

  constructor() {
    this.redis = new Redis();
  }

  async get(key: string): Promise<string | null> {
    this.operations.push(`get:${key}`);
    const value = await this.redis.get(key);
    return value ? JSON.parse(value) : null;
  }

  async set(
    key: string,
    value: string,
    options?: { ttl?: number },
  ): Promise<void> {
    this.operations.push(
      `set:${key}${options?.ttl ? `:ttl=${options.ttl}` : ''}`,
    );
    if (options?.ttl && options.ttl > 0) {
      await this.redis.set(key, JSON.stringify(value), 'EX', options.ttl);
    } else {
      await this.redis.set(key, JSON.stringify(value));
    }
  }

  async has(key: string): Promise<boolean> {
    this.operations.push(`has:${key}`);
    return (await this.redis.exists(key)) === 1;
  }

  async delete(key: string): Promise<boolean> {
    this.operations.push(`delete:${key}`);
    return (await this.redis.del(key)) > 0;
  }

  async clear(): Promise<void> {
    this.operations.push('clear');
    await this.redis.flushall();
  }

  getOperations(): string[] {
    return [...this.operations];
  }

  clearOperations(): void {
    this.operations = [];
  }

  async getStoredKeys(): Promise<string[]> {
    return this.redis.keys('*');
  }

  static async clearAllMocks() {
    await new Redis().flushall();
  }
}

describe('Custom Container Integration', () => {
  beforeEach(async () => {
    rs.useFakeTimers();
    await RedisContainer.clearAllMocks();
    configureCache({ container: undefined });
    await clearStore();
  });

  afterEach(() => {
    rs.useRealTimers();
    configureCache({ container: undefined });
  });

  describe('Basic Container Operations', () => {
    it('should cache function results with custom container', async () => {
      const redisContainer = new RedisContainer();
      configureCache({ container: redisContainer });

      const mockFn = rs.fn().mockResolvedValue('test data');
      const cachedFn = cache(mockFn, { tag: 'test' });

      const result1 = await cachedFn('param1');
      const result2 = await cachedFn('param1');
      const result3 = await cachedFn('param2');

      expect(result1).toBe('test data');
      expect(result2).toBe('test data');
      expect(result3).toBe('test data');
      expect(mockFn).toHaveBeenCalledTimes(2);

      const operations = redisContainer.getOperations();
      expect(operations.some(op => op.startsWith('get:modernjs_cache:'))).toBe(
        true,
      );
      expect(operations.some(op => op.startsWith('set:modernjs_cache:'))).toBe(
        true,
      );
    });

    it('should handle TTL and expiration correctly', async () => {
      const redisContainer = new RedisContainer();
      configureCache({ container: redisContainer });

      const mockFn = rs.fn().mockResolvedValue('test data');
      const cachedFn = cache(mockFn, {
        maxAge: CacheTime.SECOND,
        revalidate: CacheTime.SECOND,
      });

      await cachedFn('param1');
      expect(mockFn).toHaveBeenCalledTimes(1);

      const operations = redisContainer.getOperations();
      const setOperation = operations.find(op =>
        op.startsWith('set:modernjs_cache:'),
      );
      expect(setOperation).toContain('ttl=2');

      rs.advanceTimersByTime(CacheTime.SECOND / 2);
      await cachedFn('param1');
      expect(mockFn).toHaveBeenCalledTimes(1);

      rs.advanceTimersByTime(CacheTime.SECOND / 2 + 1);
      await cachedFn('param1');
      expect(mockFn).toHaveBeenCalledTimes(2);
    });

    it('should handle container switching', async () => {
      const mockFn = rs.fn().mockResolvedValue('test data');
      const cachedFn = cache(mockFn, { tag: 'test' });

      await cachedFn('param1');
      expect(mockFn).toHaveBeenCalledTimes(1);

      const redisContainer = new RedisContainer();
      configureCache({ container: redisContainer });

      await cachedFn('param1');
      expect(mockFn).toHaveBeenCalledTimes(2);

      const operations = redisContainer.getOperations();
      expect(operations.some(op => op.startsWith('get:modernjs_cache:'))).toBe(
        true,
      );
    });
  });

  describe('Tag Management', () => {
    it('should handle tags and revalidation correctly', async () => {
      const redisContainer = new RedisContainer();
      configureCache({ container: redisContainer });

      const mockFn1 = rs.fn(async (param: string): Promise<string> => {
        return 'data1';
      });

      const mockFn2 = rs.fn(async (param: string): Promise<string> => {
        return 'data2';
      });

      const cachedFn1 = cache(mockFn1, {
        tag: ['shared', 'fn1'],
        customKey: ({ generatedKey }) => `fn1:${generatedKey}`,
      });
      const cachedFn2 = cache(mockFn2, {
        tag: ['shared', 'fn2'],
        customKey: ({ generatedKey }) => `fn2:${generatedKey}`,
      });

      await cachedFn1('param');
      await cachedFn2('param');
      expect(mockFn1).toHaveBeenCalledTimes(1);
      expect(mockFn2).toHaveBeenCalledTimes(1);

      await cachedFn1('param');
      await cachedFn2('param');
      expect(mockFn1).toHaveBeenCalledTimes(1);
      expect(mockFn2).toHaveBeenCalledTimes(1);

      await revalidateTag('shared');
      await cachedFn1('param');
      await cachedFn2('param');
      expect(mockFn1).toHaveBeenCalledTimes(2);
      expect(mockFn2).toHaveBeenCalledTimes(2);

      await revalidateTag('fn1');
      await cachedFn1('param');
      await cachedFn2('param');
      expect(mockFn1).toHaveBeenCalledTimes(3);
      expect(mockFn2).toHaveBeenCalledTimes(2);

      const operations = redisContainer.getOperations();
      expect(operations.some(op => op.startsWith('delete:tag:shared'))).toBe(
        true,
      );
      expect(operations.some(op => op.startsWith('delete:tag:fn1'))).toBe(true);
    });
  });

  describe('Cache Lifecycle', () => {
    it('should handle stale-while-revalidate correctly', async () => {
      const redisContainer = new RedisContainer();
      configureCache({ container: redisContainer });

      const mockFn = rs
        .fn()
        .mockResolvedValueOnce('initial data')
        .mockResolvedValueOnce('updated data');

      const cachedFn = cache(mockFn, {
        maxAge: CacheTime.SECOND,
        revalidate: CacheTime.SECOND,
      });

      const result1 = await cachedFn('param');
      expect(result1).toBe('initial data');
      expect(mockFn).toHaveBeenCalledTimes(1);

      rs.advanceTimersByTime(CacheTime.SECOND + 500);

      const result2 = await cachedFn('param');
      expect(result2).toBe('initial data');
      expect(mockFn).toHaveBeenCalledTimes(2);

      await rs.runOnlyPendingTimersAsync();
      await Promise.resolve();
      const result3 = await cachedFn('param');
      expect(result3).toBe('updated data');
      expect(mockFn).toHaveBeenCalledTimes(2);
    });

    it('should prevent duplicate revalidation requests', async () => {
      const redisContainer = new RedisContainer();
      configureCache({ container: redisContainer });

      let resolveRevalidation: (value: string) => void;
      const revalidationPromise = new Promise<string>(resolve => {
        resolveRevalidation = resolve;
      });

      const mockFn = rs
        .fn()
        .mockResolvedValueOnce('initial data')
        .mockImplementationOnce(() => revalidationPromise);

      const cachedFn = cache(mockFn, {
        maxAge: CacheTime.SECOND,
        revalidate: CacheTime.SECOND * 2,
      });

      await cachedFn('param');
      rs.advanceTimersByTime(CacheTime.SECOND + 500);

      const results = await Promise.all([
        cachedFn('param'),
        cachedFn('param'),
        cachedFn('param'),
      ]);

      expect(results).toEqual(['initial data', 'initial data', 'initial data']);
      expect(mockFn).toHaveBeenCalledTimes(2);

      resolveRevalidation!('updated data');
      await rs.runOnlyPendingTimersAsync();
      await Promise.resolve();
    });
  });

  describe('Advanced Features', () => {
    it('should support customKey functionality', async () => {
      const redisContainer = new RedisContainer();
      configureCache({ container: redisContainer });

      const mockFn1 = rs.fn().mockResolvedValue('data1');
      const mockFn2 = rs.fn().mockResolvedValue('data2');

      const cachedFn1 = cache(mockFn1, {
        customKey: () => 'shared-key',
      });

      const cachedFn2 = cache(mockFn2, {
        customKey: () => 'shared-key',
      });

      const result1 = await cachedFn1('param');
      expect(result1).toBe('data1');
      expect(mockFn1).toHaveBeenCalledTimes(1);

      const result2 = await cachedFn2('param');
      expect(result2).toBe('data1');
      expect(mockFn2).toHaveBeenCalledTimes(0);
    });

    it('should support getKey functionality', async () => {
      const redisContainer = new RedisContainer();
      configureCache({ container: redisContainer });

      const mockFn = rs
        .fn()
        .mockImplementation((id, data) =>
          Promise.resolve(`data for ${id}: ${JSON.stringify(data)}`),
        );

      const cachedFn = cache(mockFn, {
        getKey: (...args) => `user-${args[0]}`,
      });

      const result1 = await cachedFn(1, { name: 'user1', role: 'admin' });
      const result2 = await cachedFn(1, { name: 'user1', role: 'editor' });

      expect(result1).toBe('data for 1: {"name":"user1","role":"admin"}');
      expect(result2).toBe('data for 1: {"name":"user1","role":"admin"}');
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it('should trigger onCache callbacks correctly', async () => {
      const redisContainer = new RedisContainer();
      configureCache({ container: redisContainer });

      const mockFn = rs.fn().mockResolvedValue('test data');
      const onCacheMock = rs.fn();

      const cachedFn = cache(mockFn, {
        onCache: onCacheMock,
      });

      await cachedFn('param1');
      expect(onCacheMock).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'miss' }),
      );

      onCacheMock.mockClear();
      await cachedFn('param1');
      expect(onCacheMock).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'hit' }),
      );
    });
  });

  describe('Server-side Integration', () => {
    it('should work correctly in server environment', async () => {
      const redisContainer = new RedisContainer();
      configureCache({ container: redisContainer });

      const mockFn = rs.fn().mockResolvedValue('test data');

      const cachedFnWithOptions = cache(mockFn, { maxAge: CacheTime.SECOND });

      const cachedFnWithoutOptions = cache(mockFn);

      const handler = withRequestCache(async (req: Request) => {
        const result1 = await cachedFnWithOptions('param1');
        const result2 = await cachedFnWithoutOptions('param1');
        const result3 = await cachedFnWithoutOptions('param1');
        return { result1, result2, result3 };
      });

      const { result1, result2, result3 } = await handler(
        new MockRequest() as unknown as Request,
      );

      expect(result1).toBe('test data');
      expect(result2).toBe('test data');
      expect(result3).toBe('test data');
      expect(mockFn).toHaveBeenCalledTimes(2);

      const operations = redisContainer.getOperations();
      expect(operations.some(op => op.startsWith('get:modernjs_cache:'))).toBe(
        true,
      );
    });
  });

  describe('Resource Management', () => {
    it('should clean up resources correctly', async () => {
      const redisContainer = new RedisContainer();
      configureCache({ container: redisContainer });

      const mockFn = rs.fn().mockResolvedValue('test data');
      const cachedFn = cache(mockFn, { tag: 'cleanup' });

      await cachedFn('param1');
      await cachedFn('param2');

      const keysBeforeClear = await redisContainer.getStoredKeys();
      expect(keysBeforeClear.length).toBeGreaterThan(0);

      await clearStore();

      const keysAfterClear = await redisContainer.getStoredKeys();
      expect(keysAfterClear).toHaveLength(0);
    });
  });
});
