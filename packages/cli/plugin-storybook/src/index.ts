import { createRuntimeExportsUtils } from '@modern-js/utils';
import type { CliPlugin, ModuleTools } from '@modern-js/module-tools';
import { defaultStories, appToolsStories } from './constants/stores';

export default (): CliPlugin<ModuleTools> => ({
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
    beforeBuildTask({ config }) {
      const appContext = api.useAppContext();
      const pluginsExportsUtils = createRuntimeExportsUtils(
        appContext.internalDirectory,
        'plugins',
      );
      config.alias['@modern-js/runtime/plugins'] =
        pluginsExportsUtils.getPath();
      return config;
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

          await runDev(api, {
            isTsProject: context.isTsProject,
            stories: isModuleTools ? defaultStories : appToolsStories,
            isModuleTools,
          });
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

          await runBuild({
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
