import path from 'path';
import type { Plugin as BasePlugin } from '@modern-js/plugin-v2';
import { server } from '@modern-js/plugin-v2/server';
import {
  type ServerConfig,
  type ServerPlugin,
  type ServerPluginLegacy,
  compatPlugin,
  handleSetupResult,
} from '@modern-js/server-core';
import { assign } from '@modern-js/utils/lodash';
import plugin from '../src/server';
import './helper';

const noop = () => {};

const pwd = path.resolve(__dirname, './fixtures/function');

// biome-ignore lint/suspicious/noExportsInTest: <explanation>
export async function serverInit({
  plugins,
  serverConfig,
}: {
  plugins?: (ServerPlugin | ServerPluginLegacy)[];
  serverConfig?: ServerConfig;
}) {
  const { serverContext } = await server.run({
    plugins: [compatPlugin(), ...(plugins || [])] as BasePlugin[],
    options: { appContext: {}, pwd: process.cwd() },
    config: assign(
      {},
      {
        dev: {},
        output: {},
        source: {},
        tools: {},
        server: {},
        html: {},
        runtime: {},
        bff: {},
        security: {},
      },
      serverConfig,
    ),
    handleSetupResult,
  });

  const hooks = serverContext.pluginAPI?.getHooks();
  return hooks as any;
}

describe('bff server plugin', () => {
  describe('prepareApiServer', () => {
    it('should work well', async () => {
      let apiHandlerInfos = null;
      const mockApiPlugin: ServerPluginLegacy = {
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

      const hooks = await serverInit({
        plugins: [plugin(), mockApiPlugin],
      });

      await hooks.prepareApiServer.call({
        pwd,
        prefix: '/',
      });

      expect(apiHandlerInfos).toMatchSnapshot();
    });

    it('should work well with prefix', async () => {
      let apiHandlerInfos = null;

      const mockApiPlugin: ServerPluginLegacy = {
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

      const hooks = await serverInit({
        plugins: [plugin(), mockApiPlugin],
      });

      await hooks.prepareApiServer.call({ pwd, prefix: '/api' });
      expect(apiHandlerInfos).toMatchSnapshot();
    });
  });
});
