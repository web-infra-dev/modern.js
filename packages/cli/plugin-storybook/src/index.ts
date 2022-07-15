import {
  Import,
  isTypescript,
  createRuntimeExportsUtils,
} from '@modern-js/utils';
import AnalyzePlugin from '@modern-js/plugin-analyze';
import type { CliPlugin } from '@modern-js/core';

const features: typeof import('./features') = Import.lazy(
  './features',
  require,
);

export default (): CliPlugin => ({
  name: '@modern-js/plugin-storybook',
  usePlugins: [AnalyzePlugin()],
  setup: api => ({
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
      };
    },
    // app-tools and module-tools `dev storybook`
    commands({ program }: any) {
      const { appDirectory } = api.useAppContext();
      const devCommand = program.commandsMap.get('dev');
      const stories =
        program.$$libraryName === 'module-tools'
          ? [
              `./stories/**/*.stories.mdx`,
              `./stories/**/*.stories.@(js|jsx|ts|tsx)`,
            ]
          : [`./src/**/*.stories.@(js|jsx|ts|tsx|mdx)`];
      if (devCommand) {
        devCommand.command('story').action(async () => {
          await features.runDev(api, {
            isTsProject: isTypescript(appDirectory),
            stories,
            isModuleTools: program.$$libraryName === 'module-tools',
          });
        });
        // Both story and storybook subcommands are supported
        devCommand.command('storybook').action(async () => {
          await features.runDev(api, {
            isTsProject: isTypescript(appDirectory),
            stories,
            isModuleTools: program.$$libraryName === 'module-tools',
          });
        });
      }
    },
    // module-tools build platform
    platformBuild({ isTsProject }: any) {
      return {
        name: 'storybook',
        title: 'Run Storybook log',
        taskPath: require.resolve('./build-task'),
        params: [...(isTsProject ? ['--isTsProject'] : [])],
      };
    },
    // module-tools menu mode
    moduleToolsMenu() {
      return {
        name: 'Storybook 调试',
        value: 'storybook',
        aliasValues: ['story'],
        runTask: ({ isTsProject = false }: { isTsProject: boolean }) =>
          features.runDev(api, {
            isTsProject,
            stories: [
              `./stories/**/*.stories.mdx`,
              `./stories/**/*.stories.@(js|jsx|ts|tsx)`,
            ],
          }),
      };
    },
  }),
});
