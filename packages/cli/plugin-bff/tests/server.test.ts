import path from 'path';
import { serverManager } from '@modern-js/server-plugin';
import { useAPIHandlerInfos } from '@modern-js/bff-utils';
import plugin from '../src/server';

// eslint-disable-next-line @typescript-eslint/no-empty-function
export const noop = () => {};

const pwd = path.resolve(__dirname, './fixtures/function');

describe('bff server plugin', () => {
  describe('prepareApiServer', () => {
    it('should work well', async () => {
      const main = serverManager.clone().usePlugin(plugin);
      const runner = await main.init();

      await runner.prepareApiServer(
        { pwd, mode: 'function' },
        { onLast: () => noop },
      );

      const apiHandlerInfos = main.run(useAPIHandlerInfos);
      expect(apiHandlerInfos).toMatchSnapshot();
    });

    it('should work well with prefix', async () => {
      const main = serverManager.clone().usePlugin(plugin);
      const runner = await main.init();

      await runner.prepareApiServer(
        { pwd, mode: 'function', prefix: '/api' },
        { onLast: () => noop },
      );

      const apiHandlerInfos = main.run(useAPIHandlerInfos);
      expect(apiHandlerInfos).toMatchSnapshot();
    });
  });
});
