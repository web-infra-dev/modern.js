import type { CliPlugin, ModuleTools } from '@modern-js/module-tools';
import type { PluginOptions } from './types';
import { run } from './features';

export const modulePluginDoc = (
  pluginOptions?: PluginOptions,
): CliPlugin<ModuleTools> => ({
  name: '@modern-js/plugin-module-doc',
  setup: api => ({
    registerDev() {
      return {
        name: 'doc',
        menuItem: {
          name: 'doc',
          value: 'doc',
        },
        subCommands: ['doc'],
        async action() {
          const appContext = api.useAppContext();
          const { appDirectory } = appContext;

          await run({
            ...pluginOptions,
            appDir: appDirectory,
            isProduction: false,
          });
        },
      };
    },
    registerBuildPlatform() {
      return {
        platform: 'doc',
        async build() {
          const appContext = api.useAppContext();
          const { appDirectory } = appContext;
          await run({
            ...pluginOptions,
            appDir: appDirectory,
            isProduction: true,
          });
        },
      };
    },
  }),
});

export { PluginOptions };

// deprecated default export
export default modulePluginDoc;
