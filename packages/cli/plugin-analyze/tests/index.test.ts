import { manager } from '@modern-js/core';
import plugin from '../src';

describe('analyze', () => {
  afterAll(() => {
    jest.resetAllMocks();
  });

  const mockContext: any = {
    context: {},
    get() {
      return this.context;
    },
    set(newContext: any) {
      Object.assign(this.context, newContext);
    },
  };

  test.only('existSrc', async () => {
    const main = manager
      .clone({
        useAppContext() {
          return mockContext.get();
        },
        setAppContext(value) {
          mockContext.set(value);
        },
      })
      .usePlugin(plugin);

    const runner = await main.init();
    await runner.prepare();
    await new Promise<void>(resolve => {
      manager.run(() => {
        expect(mockContext.get().existSrc).toBe(false);
        resolve();
      });
    });
  });
});
