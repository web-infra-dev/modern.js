import type { AppTools, CliPlugin } from '@modern-js/app-tools';
import _ from '@modern-js/utils/lodash';
import { ClientDefinition, SetupClientOptions } from '@modern-js/devtools-kit';
import { PartialDeep, RequiredDeep } from 'type-fest';
import { setupClientConnection } from './rpc';

export interface Options extends Partial<SetupClientOptions> {
  rpcPath?: string;
  def?: PartialDeep<ClientDefinition>;
}

const getDefaultOptions = (): RequiredDeep<Options> => ({
  rpcPath: '/_modern_js/devtools/rpc',
  def: new ClientDefinition(),
  ...new SetupClientOptions(),
});

export const devtoolsPlugin = (options?: Options): CliPlugin<AppTools> => ({
  name: '@modern-js/plugin-devtools',
  usePlugins: [],
  setup: async api => {
    const opts: RequiredDeep<Options> = _.defaultsDeep(
      options,
      getDefaultOptions(),
    );
    // setup socket server.
    const { hooks, builderPlugin, url } = await setupClientConnection({
      api,
      def: opts.def,
    });

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
