import * as path from 'path';
import { defineConfig, cli, CliPlugin } from '@modern-js/core';
import AnalyzePlugin from '@modern-js/plugin-analyze';
import FastRefreshPlugin from '@modern-js/plugin-fast-refresh/cli';
import { cleanRequireCache } from '@modern-js/utils';
import { hooks } from './hooks';
import { i18n, localeKeys } from './locale';
import { getLocaleLanguage } from './utils/language';
import { start } from './commands/start';
import { dev } from './commands/dev';
import { closeServer } from './utils/createServer';
import type { DevOptions, BuildOptions, StartOptions } from './utils/types';

export { defineConfig };

export default (): CliPlugin => ({
  name: '@modern-js/app-tools',

  post: [
    '@modern-js/plugin-analyze',
    '@modern-js/plugin-fast-refresh',
    '@modern-js/plugin-ssr',
    '@modern-js/plugin-state',
    '@modern-js/plugin-router',
    '@modern-js/plugin-polyfill',
  ],

  registerHook: hooks,

  usePlugins: [AnalyzePlugin(), FastRefreshPlugin()],

  setup: api => {
    const locale = getLocaleLanguage();
    i18n.changeLanguage({ locale });

    return {
      commands({ program }) {
        program
          .command('dev')
          .usage('[options]')
          .description(i18n.t(localeKeys.command.dev.describe))
          .option('-c --config <config>', i18n.t(localeKeys.command.dev.config))
          .option('-e --entry [entry...]', i18n.t(localeKeys.command.dev.entry))
          .option('--api-only', i18n.t(localeKeys.command.dev.apiOnly))
          .action(async (options: DevOptions) => {
            await dev(api, options);
          });

        program
          .command('build')
          .usage('[options]')
          .description(i18n.t(localeKeys.command.build.describe))
          .option('--analyze', i18n.t(localeKeys.command.build.analyze))
          .action(async (options: BuildOptions) => {
            const { build } = await import('./commands/build');
            await build(api, options);
            // force exit after build.
            // eslint-disable-next-line no-process-exit
            process.exit(0);
          });

        program
          .command('start')
          .usage('[options]')
          .description(i18n.t(localeKeys.command.start.describe))
          .option('--api-only', i18n.t(localeKeys.command.dev.apiOnly))
          .action(async (options: StartOptions) => {
            await start(api, options);
          });

        program
          .command('deploy')
          .usage('[options]')
          .description(i18n.t(localeKeys.command.deploy.describe))
          .action(async (options: any) => {
            const { build } = await import('./commands/build');
            await build(api);
            const { deploy } = await import('./commands/deploy');
            await deploy(api, options);
            // eslint-disable-next-line no-process-exit
            process.exit(0);
          });

        program
          .command('new')
          .usage('[options]')
          .description(i18n.t(localeKeys.command.new.describe))
          .option('-d, --debug', i18n.t(localeKeys.command.new.debug), false)
          .option(
            '-c, --config <config>',
            i18n.t(localeKeys.command.new.config),
          )
          .option('--dist-tag <tag>', i18n.t(localeKeys.command.new.distTag))
          .option('--registry', i18n.t(localeKeys.command.new.registry))
          .action(async (options: any) => {
            const { MWANewAction } = await import('@modern-js/new-action');
            await MWANewAction({ ...options, locale });
          });
      },

      // 这里会被 core/initWatcher 监听的文件变动触发，如果是 src 目录下的文件变动，则不做 restart
      async fileChange(e: { filename: string; eventType: string }) {
        const { filename, eventType } = e;
        const appContext = api.useAppContext();
        const { appDirectory, srcDirectory } = appContext;
        const absolutePath = path.resolve(appDirectory, filename);
        if (
          !absolutePath.includes(srcDirectory) &&
          (eventType === 'change' || eventType === 'unlink')
        ) {
          await closeServer();
          await cli.restart();
        }
      },

      async beforeRestart() {
        cleanRequireCache([
          require.resolve('@modern-js/plugin-analyze/cli'),
          require.resolve('@modern-js/plugin-fast-refresh/cli'),
        ]);
      },
    };
  },
});
