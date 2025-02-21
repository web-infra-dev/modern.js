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
    const cachedFn = cache(mockFn);

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
    const cachedFn = cache(mockFn);

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
    const cachedFn = cache(mockFn);

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
    const cachedFn = cache(mockFn);

    await expect(cachedFn('param1')).rejects.toThrow(error);
    await expect(cachedFn('param1')).rejects.toThrow(error);
    expect(mockFn).toHaveBeenCalledTimes(2); // errors should not be cached
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
      expect(mockFn).toHaveBeenCalledTimes(2); // Called once per request
    });

    it('should handle errors in request cache', async () => {
      const error = new Error('test error');
      const mockFn = jest.fn().mockRejectedValue(error);
      const cachedFn = cache(mockFn);

      const handler = withRequestCache(async (req: Request) => {
        try {
          await cachedFn('param1');
        } catch (e) {
          await cachedFn('param1'); // Second call should also throw
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
      configureCache({ maxSize: 3 * CacheSize.KB }); // 3KB cache

      const mockFn = jest.fn().mockImplementation((size: number) => {
        return Promise.resolve('x'.repeat(size));
      });
      const cachedFn = cache(mockFn, { tag: 'sizeTest' });

      await cachedFn(1024);
      expect(mockFn).toHaveBeenCalledTimes(1);

      // should hit cache
      await cachedFn(1024);
      expect(mockFn).toHaveBeenCalledTimes(1);

      // Create another 3KB string, exceeding the 3KB limit
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

      // Create many small objects
      const smallObject = { a: 'x'.repeat(10) };
      mockFn.mockResolvedValue(smallObject);

      // Create enough objects to exceed remaining cache size
      for (let i = 0; i < 50; i++) {
        await cachedFn(`key2_${i}`);
      }

      // Try to get large array again - should miss cache
      mockFn.mockResolvedValueOnce(largeArray);
      await cachedFn('key1');

      expect(mockFn).toHaveBeenCalledTimes(52); // 1 + 50 + 1
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

      // Try to get data from tag1 again - should miss as total size (4KB) exceeded limit (3KB)
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
});
