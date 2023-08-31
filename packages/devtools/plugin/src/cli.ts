import type { AppTools, CliPlugin } from '@modern-js/app-tools';
import { setupClientConnection } from './rpc';

export interface Options {
  dataSource?: string;
  version?: string;
}

export const devtoolsPlugin = (): CliPlugin<AppTools> => ({
  name: '@modern-js/plugin-devtools',
  usePlugins: [],
  setup: async api => {
    // setup socket server.
    const { hooks, builderPlugin, url } = await setupClientConnection({ api });

    return {
      prepare: hooks.prepare,
      modifyFileSystemRoutes: hooks.modifyFileSystemRoutes,
      validateSchema() {
        return [
          {
            target: 'tools.devtools',
            schema: { typeof: ['boolean'] },
          },
        ];
      },
      config() {
        return {
          builderPlugins: [builderPlugin],
          source: {
            preEntry: [require.resolve('@modern-js/plugin-devtools/runtime')],
          },
          tools: {
            devServer: {
              proxy: {
                '/_modern_js/devtools/rpc': {
                  target: url.href,
                  autoRewrite: true,
                  ws: true,
                },
              },
            },
          },
        };
      },
    };
  },
});

export default devtoolsPlugin;
