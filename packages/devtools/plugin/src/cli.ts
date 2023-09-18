import type { AppTools, CliPlugin } from '@modern-js/app-tools';
import {
  SetupClientOptions,
  RPC_SERVER_PATHNAME,
  ClientDefinition,
} from '@modern-js/devtools-kit';
import { withQuery } from 'ufo';
import { Options, resolveOptions } from './config';
import { setupClientConnection } from './rpc';

export const devtoolsPlugin = (options?: Options): CliPlugin<AppTools> => ({
  name: '@modern-js/plugin-devtools',
  usePlugins: [],
  setup: async api => {
    // setup socket server.
    const rpc = await setupClientConnection({ api });

    return {
      prepare: rpc.hooks.prepare,
      modifyFileSystemRoutes: rpc.hooks.modifyFileSystemRoutes,
      validateSchema() {
        return [
          {
            target: 'devtools',
            schema: { typeof: ['boolean', 'object'] },
          },
        ];
      },
      config() {
        const opts = resolveOptions(api, options);
        opts.def && rpc.setDefinition(opts.def);

        const mountOpts = {
          endpoint: opts.endpoint,
          version: opts.version,
          dataSource: opts.dataSource,
          __keep: true,
        } as SetupClientOptions;
        let runtimeEntry = require.resolve(
          '@modern-js/plugin-devtools/runtime',
        );
        runtimeEntry = withQuery(runtimeEntry, mountOpts);

        return {
          builderPlugins: [rpc.builderPlugin],
          source: {
            preEntry: [runtimeEntry],
            globalVars: {
              'process.env._MODERN_DEVTOOLS_LOGO_SRC': new ClientDefinition()
                .assets.logo,
            },
          },
          tools: {
            devServer: {
              proxy: {
                [opts.rpcPath ?? RPC_SERVER_PATHNAME]: {
                  target: rpc.url.href,
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
