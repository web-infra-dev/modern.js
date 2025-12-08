import { CacheTime, cache, clearStore } from '../../src/universal/cache';

describe('client-side behavior', () => {
  const originalIsServer = (global as any).window === undefined;

  beforeEach(() => {
    (global as any).window = {};
    rs.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    if (originalIsServer) {
      delete (global as any).window;
    }
    rs.restoreAllMocks();
  });

  it('should warn and execute function when no options provided on client', async () => {
    const mockFn = rs.fn().mockResolvedValue('test data');
    const cachedFn = cache(mockFn);

    const result = await cachedFn('param');

    expect(console.warn).toHaveBeenCalledWith(
      'The cache function will not work because it runs on the browser and there are no options are provided.',
    );

    expect(mockFn).toHaveBeenCalledWith('param');
    expect(result).toBe('test data');

    const result2 = await cachedFn('param');
    expect(mockFn).toHaveBeenCalledTimes(2);
    expect(result2).toBe('test data');
  });

  it('should work normally with options on client', async () => {
    const mockFn = rs.fn().mockResolvedValue('test data');
    const cachedFn = cache(mockFn, { tag: 'test' });

    const result1 = await cachedFn('param');
    const result2 = await cachedFn('param');

    expect(console.warn).not.toHaveBeenCalled();

    expect(mockFn).toHaveBeenCalledTimes(1);
    expect(result1).toBe('test data');
    expect(result2).toBe('test data');
  });
});

describe('stale-while-revalidate', () => {
  beforeEach(() => {
    rs.useFakeTimers();
    clearStore();
  });

  afterEach(() => {
    rs.useRealTimers();
  });
  it('should return stale data and revalidate in background during revalidate window', async () => {
    const mockFn = rs
      .fn()
      .mockResolvedValueOnce('initial data')
      .mockResolvedValueOnce('updated data');

    const cachedFn = cache(mockFn, {
      maxAge: CacheTime.SECOND,
      revalidate: CacheTime.SECOND * 2,
    });

    const result1 = await cachedFn('param');
    expect(result1).toBe('initial data');
    expect(mockFn).toHaveBeenCalledTimes(1);

    rs.advanceTimersByTime(CacheTime.SECOND + 500);

    const result2 = await cachedFn('param');
    expect(result2).toBe('initial data');
    expect(mockFn).toHaveBeenCalledTimes(2);

    await Promise.resolve();
    expect(mockFn).toHaveBeenCalledTimes(2);

    const result3 = await cachedFn('param');
    expect(result3).toBe('updated data');
    expect(mockFn).toHaveBeenCalledTimes(2);
  });

  it('should handle concurrent requests during revalidation', async () => {
    const mockFn = rs
      .fn()
      .mockResolvedValueOnce('initial data')
      .mockResolvedValueOnce('updated data');

    const cachedFn = cache(mockFn, {
      maxAge: CacheTime.SECOND,
      revalidate: CacheTime.SECOND * 2,
    });
    await cachedFn('param');

    rs.advanceTimersByTime(CacheTime.SECOND + 500);

    expect(mockFn).toHaveBeenCalledTimes(1);
    const results = await Promise.all([
      cachedFn('param'),
      cachedFn('param'),
      cachedFn('param'),
    ]);

    expect(results).toEqual(['initial data', 'initial data', 'initial data']);
    expect(mockFn).toHaveBeenCalledTimes(2);
  });

  it('should fetch new data when outside revalidate window', async () => {
    const mockFn = rs
      .fn()
      .mockResolvedValueOnce('initial data')
      .mockResolvedValueOnce('updated data');

    const cachedFn = cache(mockFn, {
      maxAge: CacheTime.SECOND,
      revalidate: CacheTime.SECOND * 2,
    });

    const result1 = await cachedFn('param');
    expect(result1).toBe('initial data');

    rs.advanceTimersByTime(CacheTime.SECOND * 4);

    const result2 = await cachedFn('param');
    expect(result2).toBe('updated data');
    expect(mockFn).toHaveBeenCalledTimes(2);
  });

  it('should handle background revalidation failure', async () => {
    const error = new Error('revalidation failed');
    const mockFn = rs
      .fn()
      .mockResolvedValueOnce('initial data')
      .mockRejectedValueOnce(error)
      .mockResolvedValueOnce('updated data');

    const consoleSpy = rs.spyOn(console, 'error').mockImplementation(() => {});

    const cachedFn = cache(mockFn, {
      maxAge: CacheTime.SECOND,
      revalidate: CacheTime.SECOND * 2,
    });

    const result1 = await cachedFn('param');
    expect(result1).toBe('initial data');

    rs.advanceTimersByTime(CacheTime.SECOND + 500);

    const result2 = await cachedFn('param');
    expect(result2).toBe('initial data');

    await Promise.resolve();
    expect(consoleSpy).toHaveBeenCalledWith(
      'Background revalidation failed:',
      error,
    );

    const result3 = await cachedFn('param');
    expect(result3).toBe('initial data');

    await Promise.resolve();
    const result4 = await cachedFn('param');
    expect(result4).toBe('updated data');

    consoleSpy.mockRestore();
  });

  it('should not revalidate when within maxAge', async () => {
    const mockFn = rs.fn().mockResolvedValue('test data');

    const cachedFn = cache(mockFn, {
      maxAge: CacheTime.SECOND,
      revalidate: CacheTime.SECOND * 2,
    });

    await cachedFn('param');
    expect(mockFn).toHaveBeenCalledTimes(1);

    rs.advanceTimersByTime(CacheTime.SECOND / 2);
    await cachedFn('param');

    await Promise.resolve();
    expect(mockFn).toHaveBeenCalledTimes(1);
  });
});
