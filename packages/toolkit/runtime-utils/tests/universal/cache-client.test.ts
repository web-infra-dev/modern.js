import { cache } from '../../src/universal/cache';

describe('client-side behavior', () => {
  const originalIsServer = (global as any).window === undefined;

  beforeEach(() => {
    (global as any).window = {};
    jest.spyOn(console, 'warn').mockImplementation();
  });

  afterEach(() => {
    if (originalIsServer) {
      delete (global as any).window;
    }
    jest.restoreAllMocks();
  });

  it('should warn and execute function when no options provided on client', async () => {
    const mockFn = jest.fn().mockResolvedValue('test data');
    const cachedFn = cache(mockFn);

    const result = await cachedFn('param');

    expect(console.warn).toHaveBeenCalledWith(
      'The cache function will not work because it runs on the client and there are no options are provided.',
    );

    expect(mockFn).toHaveBeenCalledWith('param');
    expect(result).toBe('test data');

    const result2 = await cachedFn('param');
    expect(mockFn).toHaveBeenCalledTimes(2);
    expect(result2).toBe('test data');
  });

  it('should work normally with options on client', async () => {
    const mockFn = jest.fn().mockResolvedValue('test data');
    const cachedFn = cache(mockFn, { tag: 'test' });

    const result1 = await cachedFn('param');
    const result2 = await cachedFn('param');

    expect(console.warn).not.toHaveBeenCalled();

    expect(mockFn).toHaveBeenCalledTimes(1);
    expect(result1).toBe('test data');
    expect(result2).toBe('test data');
  });
});
