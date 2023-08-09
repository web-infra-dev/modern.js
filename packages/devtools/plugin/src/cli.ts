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
    const { url: rpcEndpoint } = await setupClientConnection(api);
    return {
      validateSchema() {
        return [
          {
            target: 'tools.devtools',
            schema: { typeof: ['boolean'] },
          },
        ];
      },
      config() {
        const setupDevtoolsScript = require.resolve(
          '@modern-js/devtools-mount',
        );
        return {
          source: {
            preEntry: [
              `data:application/javascript,
                import { mountDevTools } from "${setupDevtoolsScript}";
                mountDevTools();
              `.replace(/\n */g, ''),
            ],
          },
          tools: {
            devServer: {
              proxy: [
                {
                  target: rpcEndpoint,
                  autoRewrite: true,
                  ws: true,
                },
              ],
            },
          },
        };
      },
    };
  },
});

export default devtoolsPlugin;
