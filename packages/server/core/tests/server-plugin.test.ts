import { serverManager } from '../src';
import { ServerConfig } from '../src/plugin';

describe('Default cases', () => {
  it('Have returns plugins', async () => {
    let count = 0;

    serverManager.usePlugin(
      serverManager.createPlugin(() => ({
        prepareApiServer: () => {
          count = 1;
          // eslint-disable-next-line @typescript-eslint/no-empty-function
          return () => {};
        },
      })),
    );

    const runner = await serverManager.init();
    await runner.prepareApiServer({ pwd: '', mode: 'function', config: {} });

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

    serverManager.usePlugin(
      serverManager.createPlugin(() => ({
        config(serverConfig) {
          serverConfig.bff = {
            proxy,
          };
          return serverConfig;
        },
      })),

      serverManager.createPlugin(() => ({
        config(serverConfig) {
          receivedServerConfig = serverConfig;
          return receivedServerConfig;
        },
      })),
    );

    const runner = await serverManager.init();
    runner.config({});
    expect(expectedServerConfig).toEqual(receivedServerConfig);
  });
});
