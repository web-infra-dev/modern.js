import type { AppTools, CliPlugin } from '@modern-js/app-tools';
import { SetupClientOptions } from '@modern-js/devtools-kit';
import { setupClientConnection } from './rpc';

export interface Options extends Partial<SetupClientOptions> {
  rpcPath?: string;
}

export const devtoolsPlugin = (options?: Options): CliPlugin<AppTools> => ({
  name: '@modern-js/plugin-devtools',
  usePlugins: [],
  setup: async api => {
    const opts: Required<Options> = {
      ...new SetupClientOptions(),
      rpcPath: '/_modern_js/devtools/rpc',
      ...options,
    };
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
                [opts.rpcPath]: {
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
