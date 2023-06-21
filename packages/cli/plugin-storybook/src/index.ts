import path from 'path';
import { createRuntimeExportsUtils } from '@modern-js/utils';
import type { CliPlugin, ModuleTools } from '@modern-js/module-tools';
import { defaultStories, appToolsStories } from './constants/stores';
import type { PluginOptions } from './types';

export type { PluginOptions } from './types';

export const storybookPlugin = (
  pluginOption: PluginOptions = {},
): CliPlugin<ModuleTools> => ({
  name: '@modern-js/plugin-storybook',
  setup: api => ({
    async validateSchema() {
      const { schema } = await import('./config/schema');
      return schema;
    },
    config() {
      const appContext = api.useAppContext();

      const pluginsExportsUtils = createRuntimeExportsUtils(
        appContext.internalDirectory,
        'plugins',
      );

      return {
        source: {
          alias: {
            '@modern-js/runtime/plugins': pluginsExportsUtils.getPath(),
          },
        },
      } as any;
    },
    beforeBuildTask(config) {
      const appContext = api.useAppContext();
      const pluginsExportsUtils = createRuntimeExportsUtils(
        appContext.internalDirectory,
        'plugins',
      );
      config.alias['@modern-js/runtime/plugins'] =
        pluginsExportsUtils.getPath();
      return config;
    },

    beforeBuild: async () => {
      const { fs } = await import('@modern-js/utils');
      const { STORYBOOK_DIST_DIR_NAME } = await import('./features/constants');
      const { appDirectory } = api.useAppContext();
      const storybookDistPath = path.join(
        appDirectory,
        'dist',
        STORYBOOK_DIST_DIR_NAME,
      );
      // If the path does not exist, `fs.remove` silently does nothing.
      await fs.remove(storybookDistPath);
    },

    registerDev() {
      return {
        name: 'storybook',
        menuItem: {
          name: 'Storybook',
          value: 'storybook',
        },
        subCommands: ['storybook', 'story'],
        async action(_, context) {
          const { runDev } = await import('./features');
          const appContext = api.useAppContext();
          const isModuleTools = appContext.toolsType === 'module-tools';

          await runDev(
            api,
            {
              isTsProject: context.isTsProject,
              stories: isModuleTools ? defaultStories : appToolsStories,
              isModuleTools,
            },
            pluginOption,
          );
        },
      };
    },

    registerBuildPlatform() {
      return {
        platform: 'storybook',
        async build(_, context) {
          const { runBuild } = await import('./features/build');
          const appContext = api.useAppContext();
          const modernConfig = api.useResolvedConfigContext();
          const isModuleTools = appContext.toolsType === 'module-tools';

          await runBuild(pluginOption, {
            stories: isModuleTools ? defaultStories : appToolsStories,
            appContext,
            modernConfig,
            isTsProject: context.isTsProject,
          });
        },
      };
    },

    // TODO: register hook for app-tools
    // [`./src/**/*.stories.@(js|jsx|ts|tsx|mdx)`]
    // isModuleTools: false
  }),
});

export default storybookPlugin;
