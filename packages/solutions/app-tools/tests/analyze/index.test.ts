import * as path from 'path';
import { manager, CliPlugin } from '@modern-js/core';
import plugin from '../../src/plugins/analyze';
import { appTools } from '../../src';

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

  // FIXME: skip the test, because the analye plugin need pass arguments
  test.skip('apiOnly', async () => {
    const main = manager
      .clone({
        useAppContext() {
          return mockContext.get();
        },
        setAppContext(value) {
          mockContext.set(value);
        },
      })
      .usePlugin(appTools as CliPlugin)
      .usePlugin(plugin as CliPlugin);

    const runner = await main.init();
    await runner.prepare();
    await new Promise<void>(resolve => {
      expect(mockContext.get().apiOnly).toBe(true);
      resolve();
    });
  });
});
