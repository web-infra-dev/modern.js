import { createContext } from '@modern-js/plugin';
import { ServerConfig, ServerPlugin } from '../src/types';
import { PluginManager } from '../src/pluginManager';
import { getDefaultConfig } from './helpers';

function createPluginManager() {
  const appContext = createContext<any>({});

  const pluginManager = new PluginManager({
    appContext,
    cliConfig: getDefaultConfig(),
  });
  return pluginManager;
}

describe('Default cases', () => {
  it('Have returns plugins', async () => {
    const pluginManager = createPluginManager();

    let count = 0;

    const serverPlugin: ServerPlugin = {
      name: 'xxx',
      setup(_) {
        return {
          prepare() {
            count = 1;
          },
        };
      },
    };

    pluginManager.addPlugins([serverPlugin]);

    const runner = await pluginManager.init();

    await runner.prepare();

    expect(count).toBe(1);
  });

  it('config hook should works correctly', async () => {
    const proxy = {
      '/bff': {
        target: 'https://modernjs.dev',
        changeOrigin: true,
      },
    };
    const expectedServerConfig = {
      bff: {
        proxy,
      },
    };
    let receivedServerConfig: ServerConfig = {};

    const pluginManager = createPluginManager();

    const serverPlugin1: ServerPlugin = {
      name: 'xxx',
      setup(_) {
        return {
          config(serverConfig) {
            serverConfig.bff = {
              proxy,
            };
            return serverConfig;
          },
        };
      },
    };

    const serverPlugin2: ServerPlugin = {
      name: 'yyy',
      setup(_) {
        return {
          config(serverConfig) {
            receivedServerConfig = serverConfig;
            return receivedServerConfig;
          },
        };
      },
    };

    pluginManager.addPlugins([serverPlugin1, serverPlugin2]);

    await pluginManager.init();

    expect(expectedServerConfig.bff).toEqual(receivedServerConfig.bff);
  });
});
