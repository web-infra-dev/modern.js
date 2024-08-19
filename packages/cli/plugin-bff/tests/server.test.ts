import path from 'path';
import {
  PluginManager,
  type ServerPlugin,
  createContext,
} from '@modern-js/server-core';
import plugin from '../src/server';
import './helper';

const noop = () => {};

const pwd = path.resolve(__dirname, './fixtures/function');

function createRunner(plugins?: ServerPlugin[]) {
  const appContext = createContext<any>({});
  const pluginManager = new PluginManager({
    appContext,
    cliConfig: {
      html: {},
      output: {},
      source: {},
      tools: {},
      server: {},
      runtime: {},
      bff: {},
      dev: {},
      security: {},
    },
  });

  plugins && pluginManager.addPlugins(plugins);

  return pluginManager.init();
}

describe('bff server plugin', () => {
  describe('prepareApiServer', () => {
    it('should work well', async () => {
      let apiHandlerInfos = null;
      const mockApiPlugin: ServerPlugin = {
        name: 'mock-api',

        setup(api) {
          return {
            prepareApiServer(props, next) {
              const appContext = api.useAppContext();
              apiHandlerInfos = appContext.apiHandlerInfos;
              return next(props);
            },
          };
        },
      };

      const runner = await createRunner([plugin(), mockApiPlugin]);

      await runner.prepareApiServer(
        {
          pwd,
          prefix: '/',
        },
        { onLast: () => noop as any },
      );

      expect(apiHandlerInfos).toMatchSnapshot();
    });

    it('should work well with prefix', async () => {
      let apiHandlerInfos = null;

      const mockApiPlugin: ServerPlugin = {
        name: 'mock-api',

        setup(api) {
          return {
            prepareApiServer(props, next) {
              const appContext = api.useAppContext();
              apiHandlerInfos = appContext.apiHandlerInfos;
              return next(props);
            },
          };
        },
      };

      const runner = await createRunner([plugin(), mockApiPlugin]);

      await runner.prepareApiServer(
        { pwd, prefix: '/api' },
        { onLast: () => noop as any },
      );
      expect(apiHandlerInfos).toMatchSnapshot();
    });
  });
});
