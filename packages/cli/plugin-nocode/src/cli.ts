import { PLUGIN_SCHEMAS } from '@modern-js/utils';
import { WebpackConfigTarget, getWebpackConfig } from '@modern-js/webpack';
import type { Configuration } from 'webpack';
import type { CliPlugin } from '@modern-js/core';
import dev from './dev';
import { register } from './register';

process.env.RUN_PLATFORM = 'true';

export default (): CliPlugin => ({
  name: '@modern-js/plugin-nocode',
  setup: api => ({
    commands({ program }) {
      program
        .command('deploy [subcmd]')
        .usage('[option]')
        .description('发布区块')
        .option('--token <token>', 'use pre-authorized token')
        .option('--auto-push', 'auto push tag')
        .action(async (subCmd: string, options: Record<string, any>) => {
          if (subCmd === 'register') {
            await register(appDirectory, modernConfig, options);
          } else if (subCmd === 'unregister') {
            await register(appDirectory, modernConfig, options, 'unregister');
          }
        });

      const devCommand = program.commandsMap.get('dev');
      const { appDirectory, internalDirectory } = api.useAppContext();
      const modernConfig = api.useResolvedConfigContext();
      if (devCommand) {
        devCommand.command('nocode').action(async () => {
          const webpackConfig = getWebpackConfig(
            WebpackConfigTarget.CLIENT,
          ) as Configuration;
          await dev(
            appDirectory,
            internalDirectory,
            webpackConfig,
            modernConfig,
          );
        });
      }
    },
    validateSchema() {
      return PLUGIN_SCHEMAS['@modern-js/plugin-nocode'];
    },
    platformBuild() {
      return {
        name: 'nocode',
        title: 'Run Nocode log',
        taskPath: require.resolve('./build-task'),
        params: [],
      };
    },
    moduleToolsMenu() {
      return {
        name: 'nocode 调试',
        value: 'nocode',
        runTask: async ({
          isTsProject: _ = false,
        }: {
          isTsProject: boolean;
        }) => {
          const { appDirectory, internalDirectory } = api.useAppContext();
          const modernConfig = api.useResolvedConfigContext();
          const webpackConfig = getWebpackConfig(
            WebpackConfigTarget.CLIENT,
          ) as Configuration;
          await dev(
            appDirectory,
            internalDirectory,
            webpackConfig,
            modernConfig,
          );
        },
      };
    },
  }),
});
