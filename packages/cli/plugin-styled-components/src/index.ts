import type { AppTools, CliPlugin } from '@modern-js/app-tools';
import { pluginStyledComponents } from '@rsbuild/plugin-styled-components';

export const styledComponentsPlugin = (): CliPlugin<AppTools> => ({
  name: '@modern-js/plugin-styled-components',

  setup(api) {
    console.log('1', 1);
    api.config(() => {
      console.log('2', 2);
      return {
        builderPlugins: [
          pluginStyledComponents({
            displayName: true,
            minify: process.env.NODE_ENV === 'production',
          }),
        ],
      };
    });
    api._internalServerPlugins(({ plugins }) => {
      plugins.push({
        name: '@modern-js/plugin-styled-components/runtime',
      });
      return { plugins };
    });
  },
});

export default styledComponentsPlugin;
