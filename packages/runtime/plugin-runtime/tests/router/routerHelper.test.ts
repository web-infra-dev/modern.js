import {
  createRouteModuleLoader,
  handleRouteModuleError,
} from '../../src/router/runtime/routerHelper';

describe('handleRouteModuleError', () => {
  beforeEach(() => {
    rstest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    rstest.restoreAllMocks();
  });

  it('preserves the original rejection and its diagnostic properties', async () => {
    const error = Object.assign(new Error('Loading route chunk failed'), {
      name: 'ChunkLoadError',
      request: 'https://example.com/route.js',
      type: 'error',
    });

    await expect(
      Promise.reject(error).catch(handleRouteModuleError),
    ).rejects.toBe(error);
    expect(console.error).toHaveBeenCalledWith(error);
  });

  it.each([undefined, null, 'module initialization failed'])(
    'preserves a non-Error rejection: %s',
    async reason => {
      await expect(
        Promise.reject(reason).catch(handleRouteModuleError),
      ).rejects.toBe(reason);
    },
  );
});

describe('createRouteModuleLoader', () => {
  const chunkError = () =>
    Object.assign(new Error('Loading route chunk failed'), {
      name: 'ChunkLoadError',
      request: 'https://example.com/route.js',
    });

  it('shares a pending import between preloading and rendering', async () => {
    let resolveModule!: (value: { default: () => null }) => void;
    const modulePromise = new Promise<{ default: () => null }>(resolve => {
      resolveModule = resolve;
    });
    const importModule = rstest.fn(() => modulePromise);
    const { preload, load } = createRouteModuleLoader(importModule);
    expect(importModule).not.toHaveBeenCalled();

    const pending = preload();
    expect(preload()).toBe(pending);
    expect(load()).toBe(pending);
    const module = { default: () => null };
    resolveModule(module);
    await expect(pending).resolves.toBe(module);
    expect(preload()).toBe(pending);
    await expect(load()).resolves.toBe(module);
    expect(importModule).toHaveBeenCalledTimes(1);
  });

  it('retains the original failure after the preload handles its rejection', async () => {
    const error = new Error('Route module initialization failed');
    const importModule = rstest.fn(() => Promise.reject(error));
    const { preload, load } = createRouteModuleLoader(importModule);

    const failed = preload();
    await failed.catch(() => {});
    // Handling the speculative preload must not turn the render's result into
    // a fulfilled promise or trigger another import of the failed module.
    expect(preload()).toBe(failed);
    expect(load()).toBe(failed);
    await expect(load()).rejects.toBe(error);
    expect(importModule).toHaveBeenCalledTimes(1);
  });

  it('retries an unconsumed chunk failure on the next preload', async () => {
    const error = chunkError();
    const module = { default: () => null };
    const importModule = rstest
      .fn<() => Promise<typeof module>>()
      .mockRejectedValueOnce(error)
      .mockResolvedValueOnce(module);
    const { preload, load } = createRouteModuleLoader(importModule);
    const failed = preload();
    await expect(failed).rejects.toBe(error);

    const retry = preload();
    expect(retry).not.toBe(failed);
    expect(preload()).toBe(retry);
    expect(load()).toBe(retry);
    await expect(retry).resolves.toBe(module);
    expect(importModule).toHaveBeenCalledTimes(2);
  });

  it('passes a settled preload failure to React without retrying', async () => {
    const error = chunkError();
    const importModule = rstest.fn(() => Promise.reject(error));
    const { preload, load } = createRouteModuleLoader(importModule);
    const failed = preload();
    await failed.catch(() => {});

    expect(load()).toBe(failed);
    expect(preload()).toBe(failed);
    await expect(load()).rejects.toBe(error);
    expect(importModule).toHaveBeenCalledTimes(1);
  });

  it('does not retry after React consumes a still-pending import', async () => {
    let rejectModule!: (error: Error) => void;
    const modulePromise = new Promise<never>((_resolve, reject) => {
      rejectModule = reject;
    });
    const importModule = rstest.fn(() => modulePromise);
    const { preload, load } = createRouteModuleLoader(importModule);
    const pending = preload();
    expect(load()).toBe(pending);
    const error = chunkError();
    rejectModule(error);
    await expect(pending).rejects.toBe(error);

    expect(preload()).toBe(pending);
    expect(importModule).toHaveBeenCalledTimes(1);
  });

  it.each([undefined, null, 'module failed', { name: 'ChunkLoadError' }])(
    'retains rejections without chunk request metadata: %s',
    async error => {
      const importModule = rstest.fn(() => Promise.reject(error));
      const { preload, load } = createRouteModuleLoader(importModule);
      const failed = preload();
      await failed.catch(() => {});

      expect(preload()).toBe(failed);
      expect(load()).toBe(failed);
      await expect(load()).rejects.toBe(error);
      expect(importModule).toHaveBeenCalledTimes(1);
    },
  );

  it('preserves a rejection whose diagnostic getter throws', async () => {
    const error = {
      get name() {
        throw new Error('Cannot inspect rejection');
      },
    };
    const { preload, load } = createRouteModuleLoader(() =>
      Promise.reject(error),
    );
    const failed = preload();
    await failed.catch(() => {});
    expect(preload()).toBe(failed);
    await expect(load()).rejects.toBe(error);
  });
});
