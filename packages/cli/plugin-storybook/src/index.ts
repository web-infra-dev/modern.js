import { createRuntimeExportsUtils } from '@modern-js/utils';
import type { CliPlugin, ModuleTools } from '@modern-js/module-tools-v2';
import { defaultStories } from './constants/stores';

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
        // FIXME: need comfirm
        // source: {
        //   alias: {
        //     '@modern-js/runtime/plugins': pluginsExportsUtils.getPath(),
        //   },
        // },
        buildConfig: {
          alias: {
            '@modern-js/runtime/plugins': pluginsExportsUtils.getPath(),
          },
        },
      };
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
          await runDev(api, {
            isTsProject: context.isTsProject,
            stories: defaultStories,
            isModuleTools: true,
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
          await runBuild({
            stories: defaultStories,
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
