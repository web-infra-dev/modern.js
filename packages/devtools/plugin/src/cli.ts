import type { AppTools, CliPlugin } from '@modern-js/app-tools';

export interface Options {
  dataSource?: string;
  version?: string;
}

export const devtoolsPlugin = (): CliPlugin<AppTools> => ({
  name: '@modern-js/plugin-devtools',
  usePlugins: [],
  setup: async _api => {
    return {
      // prepare() {},
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
        };
      },
    };
  },
});

export default devtoolsPlugin;
