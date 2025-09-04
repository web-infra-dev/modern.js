import type { AppTools, CliPlugin } from '@modern-js/app-tools';
import { pluginStyledComponents } from '@rsbuild/plugin-styled-components';

export const styledComponentsPlugin = (): CliPlugin<AppTools> => ({
  name: '@modern-js/plugin-styled-components',

  setup(api) {
    api.config(() => {
      return {
        builderPlugins: [
          pluginStyledComponents({
            displayName: true,
            minify: process.env.NODE_ENV === 'production',
          }),
        ],
        tools: {
          // styledComponents: {
          //   // https://github.com/styled-components/babel-plugin-styled-components/issues/287
          //   topLevelImportPaths: ['@modern-js/plugin-styled-components/styled'],
          // },
        },
        resolve: {
          alias: {
            'styled-components': require.resolve('styled-components'),
          },
        },
      };
    });

    api._internalRuntimePlugins(async ({ entrypoint, plugins }) => {
      plugins.push({
        name: 'styledComponents',
        path: '@modern-js/plugin-styled-components/runtime',
        config: {},
      });
      return { entrypoint, plugins };
    });
  },
});

export default styledComponentsPlugin;
