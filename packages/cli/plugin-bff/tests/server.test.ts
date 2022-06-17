import path from 'path';
import { serverManager, createPlugin } from '@modern-js/server-core';
import plugin from '../src/server';
import './helper';

// eslint-disable-next-line @typescript-eslint/no-empty-function
export const noop = () => {};

const pwd = path.resolve(__dirname, './fixtures/function');

describe('bff server plugin', () => {
  describe('prepareApiServer', () => {
    it('should work well', async () => {
      let apiHandlerInfos = null;
      const mockApiPlugin = createPlugin(api => ({
        prepareApiServer(props, next) {
          const appContext = api.useAppContext();
          // eslint-disable-next-line prefer-destructuring
          apiHandlerInfos = appContext.apiHandlerInfos;
          return next(props);
        },
      }));
      const main = serverManager.clone().usePlugin(plugin, mockApiPlugin);
      const runner = await main.init();

      await runner.prepareApiServer(
        { pwd, mode: 'function', prefix: '/' },
        { onLast: () => noop },
      );

      expect(apiHandlerInfos).toMatchSnapshot();
    });

    it('should work well with prefix', async () => {
      let apiHandlerInfos = null;
      const mockApiPlugin = createPlugin(api => ({
        prepareApiServer(props, next) {
          const appContext = api.useAppContext();
          // eslint-disable-next-line prefer-destructuring
          apiHandlerInfos = appContext.apiHandlerInfos;
          return next(props);
        },
      }));
      const main = serverManager.clone().usePlugin(plugin, mockApiPlugin);
      const runner = await main.init();

      await runner.prepareApiServer(
        { pwd, mode: 'function', prefix: '/api' },
        { onLast: () => noop },
      );

      expect(apiHandlerInfos).toMatchSnapshot();
    });
  });
});
