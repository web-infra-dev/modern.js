import type { AppTools, CliPlugin } from '@modern-js/app-tools';
import { pluginStyledComponents } from '@rsbuild/plugin-styled-components';

export const styledComponentsPlugin = (): CliPlugin<AppTools> => ({
  name: '@modern-js/plugin-styled-components',

  setup(api) {
    api.config(() => {
      const { appDirectory } = api.getAppContext();

      const { createRequire } = require('module');
      const appRequire = createRequire(
        require('path').join(appDirectory, 'package.json'),
      );

      const resolveModule = (modulePath: string): string | undefined => {
        try {
          return appRequire.resolve(modulePath);
        } catch {
          return undefined;
        }
      };

      const modulesToResolve = [
        { module: 'react', key: 'react' },
        { module: 'react-dom', key: 'react-dom' },
        { module: 'react-dom/server', key: 'react-dom/server$' },
      ];

      const resolvedModules = modulesToResolve.reduce<Record<string, string>>(
        (acc, { module, key }) => {
          const resolvedPath = resolveModule(module);
          if (resolvedPath) {
            acc[key] = resolvedPath;
          }
          return acc;
        },
        {},
      );

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
            ...resolvedModules,
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
