const INIT_SERVER_CALLBACK_MODULE = '../remote/src/runtime/initServerCallback';
const REGISTER_SERVER_CALLBACK_MODULE =
  '../remote/src/runtime/registerServerCallback';

const flushMicrotasks = async () => {
  await Promise.resolve();
  await Promise.resolve();
};

describe('initServerCallback runtime bootstrap behavior', () => {
  const originalWindow = (globalThis as { window?: unknown }).window;
  const setupRegisterCallbackMock = () => {
    const mockRegisterRemoteServerCallback = jest.fn();
    let registerModuleLoadCount = 0;

    jest.doMock(REGISTER_SERVER_CALLBACK_MODULE, () => {
      registerModuleLoadCount += 1;
      return {
        registerRemoteServerCallback: mockRegisterRemoteServerCallback,
      };
    });

    return {
      mockRegisterRemoteServerCallback,
      getRegisterModuleLoadCount: () => registerModuleLoadCount,
    };
  };

  afterEach(() => {
    if (typeof originalWindow === 'undefined') {
      delete (globalThis as { window?: unknown }).window;
      return;
    }

    (globalThis as { window?: unknown }).window = originalWindow;
  });

  it('does not bootstrap callback registration on server import', async () => {
    jest.resetModules();
    delete (globalThis as { window?: unknown }).window;
    const { mockRegisterRemoteServerCallback, getRegisterModuleLoadCount } =
      setupRegisterCallbackMock();

    await import(INIT_SERVER_CALLBACK_MODULE);
    await flushMicrotasks();

    expect(getRegisterModuleLoadCount()).toBe(0);
    expect(mockRegisterRemoteServerCallback).not.toHaveBeenCalled();
  });

  it('registers callback once with browser origin and pathname', async () => {
    jest.resetModules();
    (globalThis as { window?: unknown }).window = {
      location: {
        origin: 'http://127.0.0.1:3900',
        pathname: '/server-component-root',
      },
    };
    const { mockRegisterRemoteServerCallback, getRegisterModuleLoadCount } =
      setupRegisterCallbackMock();

    await import(INIT_SERVER_CALLBACK_MODULE);
    await flushMicrotasks();

    expect(getRegisterModuleLoadCount()).toBe(1);
    expect(mockRegisterRemoteServerCallback).toHaveBeenCalledTimes(1);
    expect(mockRegisterRemoteServerCallback).toHaveBeenCalledWith(
      'http://127.0.0.1:3900/server-component-root',
      'rscRemote',
    );
  });

  it('falls back to root action pathname when location pathname is empty', async () => {
    jest.resetModules();
    (globalThis as { window?: unknown }).window = {
      location: {
        origin: 'http://127.0.0.1:4100',
        pathname: '',
      },
    };
    const { mockRegisterRemoteServerCallback, getRegisterModuleLoadCount } =
      setupRegisterCallbackMock();

    await import(INIT_SERVER_CALLBACK_MODULE);
    await flushMicrotasks();

    expect(getRegisterModuleLoadCount()).toBe(1);
    expect(mockRegisterRemoteServerCallback).toHaveBeenCalledTimes(1);
    expect(mockRegisterRemoteServerCallback).toHaveBeenCalledWith(
      'http://127.0.0.1:4100/',
      'rscRemote',
    );
  });

  it('keeps bootstrap side effect memoized across repeated imports', async () => {
    jest.resetModules();
    (globalThis as { window?: unknown }).window = {
      location: {
        origin: 'http://127.0.0.1:4300',
        pathname: '/server-component-root',
      },
    };
    const { mockRegisterRemoteServerCallback, getRegisterModuleLoadCount } =
      setupRegisterCallbackMock();

    await import(INIT_SERVER_CALLBACK_MODULE);
    await flushMicrotasks();
    await import(INIT_SERVER_CALLBACK_MODULE);
    await flushMicrotasks();

    expect(getRegisterModuleLoadCount()).toBe(1);
    expect(mockRegisterRemoteServerCallback).toHaveBeenCalledTimes(1);
  });
});
