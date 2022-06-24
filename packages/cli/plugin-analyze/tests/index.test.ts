import * as path from 'path';
import { manager } from '@modern-js/core';
import plugin from '../src';

describe('analyze', () => {
  afterAll(() => {
    jest.resetAllMocks();
  });

  const mockContext: any = {
    context: {
      appDirectory: path.join(__dirname, './fixtures/server-routes/exist-src'),
    },
    get() {
      return this.context;
    },
    set(newContext: any) {
      Object.assign(this.context, newContext);
    },
  };

  test('apiOnly', async () => {
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
      expect(mockContext.get().apiOnly).toBe(true);
      resolve();
    });
  });
});
