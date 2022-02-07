import { manager, useAppContext } from '@modern-js/core';
import plugin from '../src';

jest.mock('@modern-js/core', () => {
  const originalModule = jest.requireActual('@modern-js/core');
  const mock_context = {
    context: {},
    get() {
      return this.context;
    },
    set(newContext: any) {
      Object.assign(this.context, newContext);
    },
  };

  return {
    __esModule: true,
    ...originalModule,
    mountHook() {
      return {
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        addRuntimeExports() {},
        modifyServerRoutes() {
          return {
            routes: [],
          };
        },
      };
    },
    useAppContext() {
      return mock_context.get();
    },
    AppContext: mock_context,
  };
});

describe('analyze', () => {
  afterAll(() => {
    jest.resetAllMocks();
  });

  test('existSrc', async () => {
    const main = manager.clone().usePlugin(plugin);
    const runner = await main.init();
    await runner.prepare();
    await new Promise<void>(resolve => {
      manager.run(() => {
        const appContext = useAppContext();
        expect(appContext.existSrc).toBe(false);
        resolve();
      });
    });
  });
});
