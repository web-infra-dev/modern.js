import path from 'path';
import { defineConfig, cli, CliPlugin } from '@modern-js/core';
import AnalyzePlugin from '@modern-js/plugin-analyze';
import LintPlugin from '@modern-js/plugin-jarvis';
import { cleanRequireCache } from '@modern-js/utils';
import { hooks } from './hooks';
import { i18n, localeKeys } from './locale';
import { getLocaleLanguage } from './utils/language';
import type { DevOptions, BuildOptions, DeployOptions } from './utils/types';

export { defineConfig };

export default (): CliPlugin => ({
  name: '@modern-js/app-tools',

  post: [
    '@modern-js/plugin-analyze',
    '@modern-js/plugin-ssr',
    '@modern-js/plugin-state',
    '@modern-js/plugin-router',
    '@modern-js/plugin-polyfill',
  ],

  registerHook: hooks,

  usePlugins: [AnalyzePlugin(), LintPlugin()],

  setup: api => {
    const locale = getLocaleLanguage();
    i18n.changeLanguage({ locale });

    return {
      commands({ program }) {
        program
          .command('dev')
          .usage('[options]')
          .description(i18n.t(localeKeys.command.dev.describe))
          .option(
            '-c --config <config>',
            i18n.t(localeKeys.command.shared.config),
          )
          .option('-e --entry [entry...]', i18n.t(localeKeys.command.dev.entry))
          .option('--analyze', i18n.t(localeKeys.command.shared.analyze))
          .option('--api-only', i18n.t(localeKeys.command.dev.apiOnly))
          .action(async (options: DevOptions) => {
            const { dev } = await import('./commands/dev');
            await dev(api, options);
          });

        program
          .command('build')
          .usage('[options]')
          .description(i18n.t(localeKeys.command.build.describe))
          .option(
            '-c --config <config>',
            i18n.t(localeKeys.command.shared.config),
          )
          .option('--analyze', i18n.t(localeKeys.command.shared.analyze))
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
          .action(async () => {
            const { start } = await import('./commands/start');
            await start(api);
          });

        program
          .command('deploy')
          .usage('[options]')
          .option(
            '-c --config <config>',
            i18n.t(localeKeys.command.shared.config),
          )
          .description(i18n.t(localeKeys.command.deploy.describe))
          .action(async (options: DeployOptions) => {
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

        program
          .command('inspect')
          .description('inspect internal webpack config')
          .option(
            `--env <env>`,
            i18n.t(localeKeys.command.inspect.env),
            'development',
          )
          .option(
            '--output <output>',
            i18n.t(localeKeys.command.inspect.output),
            '/',
          )
          .option('--no-console', i18n.t(localeKeys.command.inspect.noConsole))
          .option('--verbose', i18n.t(localeKeys.command.inspect.verbose))
          .action(async options => {
            const { inspect } = await import('./commands/inspect');
            inspect(api, options);
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
          const { closeServer } = await import('./utils/createServer');
          await closeServer();
          await cli.restart();
        }
      },

      async beforeRestart() {
        cleanRequireCache([require.resolve('@modern-js/plugin-analyze/cli')]);
      },
    };
  },
});
