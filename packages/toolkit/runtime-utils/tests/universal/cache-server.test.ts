/**
 * @jest-environment node
 */
import {
  CacheSize,
  CacheTime,
  cache,
  clearStore,
  configureCache,
  generateKey,
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

describe('cache function', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    clearStore();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should cache function call results', async () => {
    const mockFn = jest.fn().mockResolvedValue('test data');
    const cachedFn = cache(mockFn, {
      tag: 'testTag',
    });

    const result1 = await cachedFn('param1');
    const result2 = await cachedFn('param1');

    expect(result1).toBe('test data');
    expect(result2).toBe('test data');
    expect(mockFn).toHaveBeenCalledTimes(1);
  });

  it('should have separate caches for different parameters', async () => {
    const mockFn = jest.fn((param: string) =>
      Promise.resolve(`result_${param}`),
    );
    const cachedFn = cache(mockFn, {
      tag: 'testTag',
    });

    const result1 = await cachedFn('param1');
    const result2 = await cachedFn('param2');
    const result3 = await cachedFn('param1');

    expect(result1).toBe('result_param1');
    expect(result2).toBe('result_param2');
    expect(result3).toBe('result_param1');
    expect(mockFn).toHaveBeenCalledTimes(2);
  });

  it('should expire after maxAge', async () => {
    const mockFn = jest.fn().mockResolvedValue('test data');
    const cachedFn = cache(mockFn, { maxAge: CacheTime.SECOND });

    await cachedFn('param1');
    jest.advanceTimersByTime(CacheTime.SECOND / 2);
    await cachedFn('param1');
    expect(mockFn).toHaveBeenCalledTimes(1);

    jest.advanceTimersByTime(CacheTime.SECOND / 2 + 1);
    await cachedFn('param1');
    expect(mockFn).toHaveBeenCalledTimes(2);
  });

  it('should use default maxAge', async () => {
    const mockFn = jest.fn().mockResolvedValue('test data');
    const cachedFn = cache(mockFn, {
      tag: 'testTag',
    });

    await cachedFn('param1');
    jest.advanceTimersByTime(CacheTime.MINUTE * 5 - 1);
    await cachedFn('param1');
    expect(mockFn).toHaveBeenCalledTimes(1);

    jest.advanceTimersByTime(1);
    await cachedFn('param1');
    expect(mockFn).toHaveBeenCalledTimes(2);
  });

  it('should invalidate cache when revalidateTag is called', async () => {
    const mockFn = jest.fn().mockResolvedValue('test data');
    const cachedFn = cache(mockFn, { tag: 'testTag' });

    await cachedFn('param1');
    await cachedFn('param1');
    expect(mockFn).toHaveBeenCalledTimes(1);

    revalidateTag('testTag');

    await cachedFn('param1');
    expect(mockFn).toHaveBeenCalledTimes(2);
  });

  it('should support array of tags', async () => {
    const mockFn = jest.fn().mockResolvedValue('test data');
    const cachedFn = cache(mockFn, { tag: ['tag1', 'tag2'] });

    await cachedFn('param1');
    await cachedFn('param1');
    expect(mockFn).toHaveBeenCalledTimes(1);

    revalidateTag('tag1');
    await cachedFn('param1');
    expect(mockFn).toHaveBeenCalledTimes(2);

    await cachedFn('param1');
    expect(mockFn).toHaveBeenCalledTimes(2);

    revalidateTag('tag2');
    await cachedFn('param1');
    expect(mockFn).toHaveBeenCalledTimes(3);
  });

  it('should revalidate all functions associated with a tag', async () => {
    const mockFn1 = jest.fn().mockResolvedValue('data1');
    const mockFn2 = jest.fn().mockResolvedValue('data2');
    const cachedFn1 = cache(mockFn1, { tag: 'shared' });
    const cachedFn2 = cache(mockFn2, { tag: ['shared', 'other'] });

    await cachedFn1('param1');
    await cachedFn2('param2');
    expect(mockFn1).toHaveBeenCalledTimes(1);
    expect(mockFn2).toHaveBeenCalledTimes(1);

    revalidateTag('shared');

    await cachedFn1('param1');
    await cachedFn2('param2');
    expect(mockFn1).toHaveBeenCalledTimes(2);
    expect(mockFn2).toHaveBeenCalledTimes(2);

    revalidateTag('other');
    await cachedFn1('param1');
    await cachedFn2('param2');
    expect(mockFn1).toHaveBeenCalledTimes(2);
    expect(mockFn2).toHaveBeenCalledTimes(3);
  });

  it('should handle errors correctly', async () => {
    const error = new Error('test error');
    const mockFn = jest.fn().mockRejectedValue(error);
    const cachedFn = cache(mockFn, {
      tag: 'testTag',
    });

    await expect(cachedFn('param1')).rejects.toThrow(error);
    await expect(cachedFn('param1')).rejects.toThrow(error);
    expect(mockFn).toHaveBeenCalledTimes(2);
  });

  describe('server-side caching', () => {
    it('should cache within request lifecycle when no options provided', async () => {
      const mockFn = jest.fn().mockResolvedValue('test data');
      const cachedFn = cache(mockFn);

      const handler = withRequestCache(async (req: Request) => {
        const result1 = await cachedFn('param1');
        const result2 = await cachedFn('param1');
        const result3 = await cachedFn('param2');
        return { result1, result2, result3 };
      });

      const { result1, result2, result3 } = await handler(
        new MockRequest() as unknown as Request,
      );

      expect(result1).toBe('test data');
      expect(result2).toBe('test data');
      expect(result3).toBe('test data');
      expect(mockFn).toHaveBeenCalledTimes(2); // Called once for 'param1' and once for 'param2'
    });

    it('should not mix different functions with same parameters', async () => {
      const mockFn1 = jest.fn().mockResolvedValue('data1');
      const mockFn2 = jest.fn().mockResolvedValue('data2');
      const cachedFn1 = cache(mockFn1);
      const cachedFn2 = cache(mockFn2);

      const handler = withRequestCache(async (req: Request) => {
        const result1 = await cachedFn1('sameParam');
        const result2 = await cachedFn2('sameParam');
        const result3 = await cachedFn1('sameParam');
        return { result1, result2, result3 };
      });

      const { result1, result2, result3 } = await handler(
        new MockRequest() as unknown as Request,
      );

      expect(result1).toBe('data1');
      expect(result2).toBe('data2');
      expect(result3).toBe('data1');
      expect(mockFn1).toHaveBeenCalledTimes(1);
      expect(mockFn2).toHaveBeenCalledTimes(1);
    });

    it('should use normal caching when options provided on server', async () => {
      const mockFn = jest.fn().mockResolvedValue('test data');
      const cachedFn = cache(mockFn, { maxAge: CacheTime.SECOND });

      const handler1 = withRequestCache(async () => {
        const result1 = await cachedFn('param1');
        return result1;
      });

      const handler2 = withRequestCache(async () => {
        const result2 = await cachedFn('param1');
        return result2;
      });

      const result1 = await handler1();
      const result2 = await handler2();

      expect(result1).toBe('test data');
      expect(result2).toBe('test data');
      expect(mockFn).toHaveBeenCalledTimes(1);

      jest.advanceTimersByTime(CacheTime.SECOND + 1);

      const result3 = await handler1();
      expect(result3).toBe('test data');
      expect(mockFn).toHaveBeenCalledTimes(2);
    });

    it('should not share cache between different requests', async () => {
      const mockFn = jest.fn().mockResolvedValue('test data');
      const cachedFn = cache(mockFn);

      const handler = withRequestCache(async (req: Request) => {
        return cachedFn('param1');
      });

      const result1 = await handler(new MockRequest() as unknown as Request);
      const result2 = await handler(new MockRequest() as unknown as Request);

      expect(result1).toBe('test data');
      expect(result2).toBe('test data');
      expect(mockFn).toHaveBeenCalledTimes(2);
    });

    it('should handle errors in request cache', async () => {
      const error = new Error('test error');
      const mockFn = jest.fn().mockRejectedValue(error);
      const cachedFn = cache(mockFn);

      const handler = withRequestCache(async (req: Request) => {
        try {
          await cachedFn('param1');
        } catch (e) {
          await cachedFn('param1');
          return 'should not reach here';
        }
      });

      await expect(
        handler(new MockRequest() as unknown as Request),
      ).rejects.toThrow(error);
      expect(mockFn).toHaveBeenCalledTimes(2);
    });

    it('should handle nested request handlers', async () => {
      const mockFn = jest.fn().mockResolvedValue('test data');
      const cachedFn = cache(mockFn);

      const innerHandler = withRequestCache(async (req: Request) => {
        return cachedFn('param1');
      });

      const outerHandler = withRequestCache(async (req: Request) => {
        const result1 = await innerHandler(req);
        const result2 = await cachedFn('param1');
        return { result1, result2 };
      });

      const { result1, result2 } = await outerHandler(
        new MockRequest() as unknown as Request,
      );

      expect(result1).toBe('test data');
      expect(result2).toBe('test data');
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it('should handle concurrent requests with same parameters', async () => {
      const mockFn = jest.fn().mockImplementation(async () => {
        return 'test data';
      });
      const cachedFn = cache(mockFn);

      const handler = withRequestCache(async (req: Request) => {
        return cachedFn('param1');
      });

      const request = new MockRequest() as unknown as Request;

      const results = await Promise.all([
        handler(request),
        handler(request),
        handler(request),
      ]);

      expect(results).toEqual(['test data', 'test data', 'test data']);
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it('should handle concurrent requests', async () => {
      const mockFn = jest.fn().mockResolvedValue('test data');
      const cachedFn = cache(mockFn);

      const handler = withRequestCache(async (req: Request) => {
        return cachedFn('param1');
      });

      await Promise.all([
        handler(new MockRequest() as unknown as Request),
        handler(new MockRequest() as unknown as Request),
        handler(new MockRequest() as unknown as Request),
      ]);

      expect(mockFn).toHaveBeenCalledTimes(3);
    });
  });

  describe('LRU cache size limits', () => {
    beforeEach(() => {
      clearStore();
    });

    it('should limit cache based on data size', async () => {
      configureCache({ maxSize: 3 * CacheSize.KB });

      const mockFn = jest.fn().mockImplementation((size: number) => {
        return Promise.resolve('x'.repeat(size));
      });
      const cachedFn = cache(mockFn, { tag: 'sizeTest' });

      await cachedFn(1024);
      expect(mockFn).toHaveBeenCalledTimes(1);

      await cachedFn(1024);
      expect(mockFn).toHaveBeenCalledTimes(1);

      await cachedFn(3 * CacheSize.KB);

      await cachedFn(1024);
      expect(mockFn).toHaveBeenCalledTimes(3);
    });

    it('should estimate object sizes for cache limits', async () => {
      configureCache({ maxSize: 3 * CacheSize.KB });

      const mockFn = jest.fn();
      const cachedFn = cache(mockFn, { tag: 'estimateTest' });

      const largeArray = new Array(100).fill('x'.repeat(10));
      mockFn.mockResolvedValueOnce(largeArray);
      await cachedFn('key1');
      expect(mockFn).toHaveBeenCalledTimes(1);

      const smallObject = { a: 'x'.repeat(10) };
      mockFn.mockResolvedValue(smallObject);

      for (let i = 0; i < 50; i++) {
        await cachedFn(`key2_${i}`);
      }

      mockFn.mockResolvedValueOnce(largeArray);
      await cachedFn('key1');

      expect(mockFn).toHaveBeenCalledTimes(52);
    });

    it('should share LRU cache store between different tags', async () => {
      configureCache({ maxSize: 3 * CacheSize.KB });

      const mockFn = jest.fn();
      const cachedFn1 = cache(mockFn, { tag: 'tag1' });
      const cachedFn2 = cache(mockFn, { tag: 'tag2' });

      const largeData = 'x'.repeat(2 * CacheSize.KB);
      mockFn.mockResolvedValueOnce(largeData);
      await cachedFn1('key1');

      const mediumData = 'x'.repeat(2 * CacheSize.KB);
      mockFn.mockResolvedValueOnce(mediumData);
      await cachedFn2('key2');

      await cachedFn1('key1');

      expect(mockFn).toHaveBeenCalledTimes(3);
    });
  });

  describe('generateKey', () => {
    it('should generate same key for objects with different property orders', () => {
      const obj1 = { a: 1, b: 2 };
      const obj2 = { b: 2, a: 1 };

      expect(generateKey([obj1])).toBe(generateKey([obj2]));
    });

    it('should generate different keys for different objects', () => {
      const obj1 = { a: 1, b: 2 };
      const obj2 = { a: 1, b: 3 };

      expect(generateKey([obj1])).not.toBe(generateKey([obj2]));
    });

    it('should handle nested objects', () => {
      const obj1 = { a: { x: 1, y: 2 }, b: 3 };
      const obj2 = { b: 3, a: { y: 2, x: 1 } };

      expect(generateKey([obj1])).toBe(generateKey([obj2]));
    });

    it('should handle arrays correctly', () => {
      const arr1 = [1, 2, 3];
      const arr2 = [1, 2, 3];
      const arr3 = [3, 2, 1];

      expect(generateKey([arr1])).toBe(generateKey([arr2]));
      expect(generateKey([arr1])).not.toBe(generateKey([arr3]));
    });

    it('should handle mixed types', () => {
      const input1 = [{ a: 1 }, 'string', 123, true];
      const input2 = [{ a: 1 }, 'string', 123, true];
      const input3 = [{ a: 2 }, 'string', 123, true];

      expect(generateKey(input1)).toBe(generateKey(input2));
      expect(generateKey(input1)).not.toBe(generateKey(input3));
    });

    it('should handle special values', () => {
      expect(generateKey([null])).toBe(generateKey([null]));
      expect(generateKey([undefined])).toBe(generateKey([undefined]));
      expect(generateKey([NaN])).toBe(generateKey([NaN]));
      expect(generateKey([Infinity])).toBe(generateKey([Infinity]));
    });

    it('should handle Date objects', () => {
      const date1 = new Date('2025-01-01');
      const date2 = new Date('2025-01-01');
      const date3 = new Date('2025-01-02');

      expect(generateKey([date1])).toBe(generateKey([date2]));
      expect(generateKey([date1])).not.toBe(generateKey([date3]));
    });

    it('should handle empty objects and arrays', () => {
      expect(generateKey([{}])).toBe(generateKey([{}]));
      expect(generateKey([[]])).toBe(generateKey([[]]));
      expect(generateKey([{}])).not.toBe(generateKey([[]]));
    });
  });

  describe('customKey', () => {
    it('should share cache between different functions with same customKey', async () => {
      const mockFn1 = jest.fn().mockResolvedValue('data1');
      const mockFn2 = jest.fn().mockResolvedValue('data2');

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

    it('should support Symbol as customKey return value', async () => {
      const SYMBOL_KEY = Symbol('test-symbol');
      const mockFn = jest.fn().mockResolvedValue('symbol data');

      const cachedFn = cache(mockFn, {
        customKey: () => SYMBOL_KEY,
      });

      const result1 = await cachedFn('param1');
      expect(result1).toBe('symbol data');
      expect(mockFn).toHaveBeenCalledTimes(1);

      const result2 = await cachedFn('param2');
      expect(result2).toBe('symbol data');
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it('should support customKey that depends on function arguments', async () => {
      const mockFn = jest
        .fn()
        .mockImplementation(id => Promise.resolve(`data for ${id}`));

      const cachedFn = cache(mockFn, {
        customKey: ({ params }) => `user-${params[0]}`,
      });

      const result1 = await cachedFn(1);
      const result2 = await cachedFn(2);
      const result3 = await cachedFn(1);

      expect(result1).toBe('data for 1');
      expect(result2).toBe('data for 2');
      expect(result3).toBe('data for 1');
      expect(mockFn).toHaveBeenCalledTimes(2);
    });

    it('should respect maxAge and work with tag revalidation', async () => {
      const mockFn = jest.fn().mockResolvedValue('cached data');
      const cachedFn = cache(mockFn, {
        tag: 'custom-tag',
        customKey: () => 'test-key',
        maxAge: CacheTime.SECOND,
      });

      await cachedFn('param');
      expect(mockFn).toHaveBeenCalledTimes(1);

      await cachedFn('param');
      expect(mockFn).toHaveBeenCalledTimes(1);

      revalidateTag('custom-tag');
      await cachedFn('param');
      expect(mockFn).toHaveBeenCalledTimes(2);

      jest.advanceTimersByTime(CacheTime.SECOND + 1);
      await cachedFn('param');
      expect(mockFn).toHaveBeenCalledTimes(3);
    });
  });

  describe('getKey', () => {
    beforeEach(() => {
      jest.useFakeTimers();
      clearStore();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should use getKey to generate custom cache key', async () => {
      const mockFn = jest
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

    it('should use getKey over default key generation', async () => {
      const mockFn = jest.fn().mockResolvedValue('test data');
      const onCacheMock = jest.fn();

      const cachedFn = cache(mockFn, {
        getKey: () => 'constant-key',
        onCache: onCacheMock,
      });

      await cachedFn('param1');
      await cachedFn('param2');

      expect(mockFn).toHaveBeenCalledTimes(1);
      expect(onCacheMock).toHaveBeenCalledTimes(2);
      expect(onCacheMock).toHaveBeenLastCalledWith(
        expect.objectContaining({
          status: 'hit',
          key: 'constant-key',
        }),
      );
    });

    it('should work with getKey and tag revalidation', async () => {
      const mockFn = jest.fn().mockResolvedValue('test data');

      const cachedFn = cache(mockFn, {
        tag: 'getKey-test',
        getKey: (...args) => `key-${args[0]}`,
      });

      await cachedFn('a');
      await cachedFn('a');
      expect(mockFn).toHaveBeenCalledTimes(1);

      revalidateTag('getKey-test');

      await cachedFn('a');
      expect(mockFn).toHaveBeenCalledTimes(2);
    });
  });

  describe('cache statistics', () => {
    beforeEach(() => {
      jest.useFakeTimers();
      clearStore();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should call onCache with hit status when cache hit', async () => {
      const mockFn = jest.fn().mockResolvedValue('test data');
      const onCacheMock = jest.fn();

      const cachedFn = cache(mockFn, {
        maxAge: CacheTime.MINUTE,
        onCache: onCacheMock,
      });

      await cachedFn('param1');
      expect(onCacheMock).toHaveBeenCalledTimes(1);
      expect(onCacheMock).toHaveBeenLastCalledWith(
        expect.objectContaining({
          status: 'miss',
          params: ['param1'],
          result: 'test data',
        }),
      );

      onCacheMock.mockClear();
      await cachedFn('param1');
      expect(onCacheMock).toHaveBeenCalledTimes(1);
      expect(onCacheMock).toHaveBeenLastCalledWith(
        expect.objectContaining({
          status: 'hit',
          params: ['param1'],
          result: 'test data',
        }),
      );
    });

    it('should call onCache with stale status when in revalidate window', async () => {
      const mockFn = jest.fn().mockResolvedValue('test data');
      const onCacheMock = jest.fn();

      const cachedFn = cache(mockFn, {
        maxAge: CacheTime.SECOND,
        revalidate: CacheTime.SECOND,
        onCache: onCacheMock,
      });

      await cachedFn('param1');
      onCacheMock.mockClear();

      jest.advanceTimersByTime(CacheTime.SECOND + 10);

      await cachedFn('param1');
      expect(onCacheMock).toHaveBeenCalledTimes(1);
      expect(onCacheMock).toHaveBeenLastCalledWith(
        expect.objectContaining({
          status: 'stale',
          params: ['param1'],
          result: 'test data',
        }),
      );

      expect(mockFn).toHaveBeenCalledTimes(2);
    });

    it('should include correct key in onCache callback', async () => {
      const mockFn = jest.fn().mockResolvedValue('test data');
      const onCacheMock = jest.fn();

      // Case 1: Default key (function reference)
      const cachedFn1 = cache(mockFn, {
        onCache: onCacheMock,
      });

      await cachedFn1('param1');
      expect(onCacheMock).toHaveBeenLastCalledWith(
        expect.objectContaining({
          status: 'miss',
          key: JSON.stringify(['param1']),
        }),
      );

      onCacheMock.mockClear();

      // Case 2: Custom string key
      const CUSTOM_KEY = 'my-custom-key';
      const cachedFn2 = cache(mockFn, {
        customKey: () => CUSTOM_KEY,
        onCache: onCacheMock,
      });

      await cachedFn2('param1');
      expect(onCacheMock).toHaveBeenLastCalledWith(
        expect.objectContaining({
          status: 'miss',
          key: CUSTOM_KEY,
        }),
      );

      onCacheMock.mockClear();

      // Case 3: Custom symbol key
      const SYMBOL_KEY = Symbol('test-key');
      const cachedFn3 = cache(mockFn, {
        customKey: () => SYMBOL_KEY,
        onCache: onCacheMock,
      });

      await cachedFn3('param1');
      expect(onCacheMock).toHaveBeenLastCalledWith(
        expect.objectContaining({
          status: 'miss',
          key: SYMBOL_KEY,
        }),
      );
    });

    it('should not call onCache when no options are provided', async () => {
      const mockFn = jest.fn().mockResolvedValue('test data');
      const onCacheMock = jest.fn();

      const cachedFn = cache(mockFn);

      const handler = withRequestCache(async (req: Request) => {
        const result1 = await cachedFn('param1');
        const result2 = await cachedFn('param1');
        return { result1, result2 };
      });

      await handler(new MockRequest() as unknown as Request);
      expect(onCacheMock).not.toHaveBeenCalled();
    });
  });

  describe('unstable_shouldDisable', () => {
    beforeEach(() => {
      jest.useFakeTimers();
      clearStore();
    });

    afterEach(() => {
      jest.useRealTimers();
      configureCache({ maxSize: CacheSize.GB });
    });

    it('should bypass cache when unstable_shouldDisable returns true', async () => {
      const mockFn = jest.fn().mockResolvedValue('test data');
      const cachedFn = cache(mockFn, { maxAge: CacheTime.MINUTE });

      configureCache({
        maxSize: CacheSize.GB,
        unstable_shouldDisable: () => true,
      });

      const handler = withRequestCache(async (req: Request) => {
        const result1 = await cachedFn('param1');
        const result2 = await cachedFn('param1');
        return { result1, result2 };
      });

      await handler(new MockRequest() as unknown as Request);

      expect(mockFn).toHaveBeenCalledTimes(2);
    });

    it('should use cache when unstable_shouldDisable returns false', async () => {
      const mockFn = jest.fn().mockResolvedValue('test data');
      const cachedFn = cache(mockFn, { maxAge: CacheTime.MINUTE });

      configureCache({
        maxSize: CacheSize.GB,
        unstable_shouldDisable: () => false,
      });

      const handler = withRequestCache(async (req: Request) => {
        const result1 = await cachedFn('param1');
        const result2 = await cachedFn('param1');
        return { result1, result2 };
      });

      await handler(new MockRequest() as unknown as Request);

      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it('should support dynamic decision based on request', async () => {
      const mockFn = jest.fn().mockResolvedValue('test data');
      const cachedFn = cache(mockFn, { tag: 'testTag' });

      configureCache({
        maxSize: CacheSize.GB,
        unstable_shouldDisable: ({ request }) => {
          return request.url.includes('no-cache');
        },
      });

      const handlerWithCache = withRequestCache(async (req: Request) => {
        const result1 = await cachedFn('param1');
        const result2 = await cachedFn('param1');
        return { result1, result2 };
      });

      const handlerWithoutCache = withRequestCache(async (req: Request) => {
        const result1 = await cachedFn('param1');
        const result2 = await cachedFn('param1');
        return { result1, result2 };
      });

      await handlerWithCache(
        new MockRequest('http://example.com') as unknown as Request,
      );

      await handlerWithoutCache(
        new MockRequest('http://example.com/no-cache') as unknown as Request,
      );

      expect(mockFn).toHaveBeenCalledTimes(3);
    });

    it('should affect no-options cache as well', async () => {
      const mockFn = jest.fn().mockResolvedValue('test data');
      const cachedFn = cache(mockFn);
      configureCache({
        maxSize: CacheSize.GB,
        unstable_shouldDisable: () => true,
      });

      const handler = withRequestCache(async (req: Request) => {
        const result1 = await cachedFn('param1');
        const result2 = await cachedFn('param1');
        return { result1, result2 };
      });

      await handler(new MockRequest() as unknown as Request);

      expect(mockFn).toHaveBeenCalledTimes(2);
    });

    it('should support async decision function', async () => {
      const mockFn = jest.fn().mockResolvedValue('test data');
      const cachedFn = cache(mockFn, { maxAge: CacheTime.MINUTE });

      configureCache({
        maxSize: CacheSize.GB,
        unstable_shouldDisable: async () => {
          return Promise.resolve(true);
        },
      });

      const handler = withRequestCache(async (req: Request) => {
        const result1 = await cachedFn('param1');
        const result2 = await cachedFn('param1');
        return { result1, result2 };
      });

      await handler(new MockRequest() as unknown as Request);

      expect(mockFn).toHaveBeenCalledTimes(2);
    });

    it('should still trigger onCache callback even when cache is disabled', async () => {
      const mockFn = jest.fn().mockResolvedValue('test data');
      const onCacheMock = jest.fn();

      const cachedFn = cache(mockFn, {
        maxAge: CacheTime.MINUTE,
        onCache: onCacheMock,
      });

      configureCache({
        maxSize: CacheSize.GB,
        unstable_shouldDisable: () => true,
      });

      const handler = withRequestCache(async (req: Request) => {
        const result1 = await cachedFn('param1');
        const result2 = await cachedFn('param1');
        return { result1, result2 };
      });

      await handler(new MockRequest() as unknown as Request);

      expect(mockFn).toHaveBeenCalledTimes(2);
      expect(onCacheMock).toHaveBeenCalledTimes(2);
      expect(onCacheMock).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'miss',
        }),
      );
    });
  });
});
