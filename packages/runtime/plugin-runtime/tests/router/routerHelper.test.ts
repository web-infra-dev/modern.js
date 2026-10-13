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
  it('shares a pending import between preloading and rendering', async () => {
    let resolveModule!: (value: { default: () => null }) => void;
    const modulePromise = new Promise<{ default: () => null }>(resolve => {
      resolveModule = resolve;
    });
    const importModule = rstest.fn(() => modulePromise);
    const load = createRouteModuleLoader(importModule);
    expect(importModule).not.toHaveBeenCalled();

    const preload = load();
    expect(load()).toBe(preload);
    const module = { default: () => null };
    resolveModule(module);
    await expect(preload).resolves.toBe(module);
    await expect(load()).resolves.toBe(module);
    expect(importModule).toHaveBeenCalledTimes(1);
  });

  it('retains the original failure after the preload handles its rejection', async () => {
    const error = new Error('Route module initialization failed');
    const importModule = rstest.fn(() => Promise.reject(error));
    const load = createRouteModuleLoader(importModule);

    const preload = load();
    await preload.catch(() => {});
    // Handling the speculative preload must not turn the render's result into
    // a fulfilled promise or trigger another import of the failed module.
    expect(load()).toBe(preload);
    await expect(load()).rejects.toBe(error);
    expect(importModule).toHaveBeenCalledTimes(1);
  });
});
