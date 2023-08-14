import { BaseHooks } from '@modern-js/core';
import type { AppTools, AppToolsHooks, CliPlugin } from '@modern-js/app-tools';
import { setupClientConnection } from './rpc';

export interface Options {
  dataSource?: string;
  version?: string;
}

export type Hooks = BaseHooks<any> & AppToolsHooks<any>;

export const devtoolsPlugin = (): CliPlugin<AppTools> => ({
  name: '@modern-js/plugin-devtools',
  usePlugins: [],
  setup: async api => {
    // setup socket server.
    const { hooks, url } = await setupClientConnection({ api });

    return {
      prepare: hooks.prepare,
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
                const dataSource = "${url}";
                if (dataSource.startsWith('/')) {
                  const url = new URL(location);
                  url.protocol = 'ws:';
                  url.pathname = dataSource;
                  mountDevTools({ dataSource: url });
                } else {
                  throw new Error('Unimplemented.');
                }
              `.replace(/\n */g, ''),
            ],
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
