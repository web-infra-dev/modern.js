import { createPlugin, defineConfig, usePlugins, cli } from '@modern-js/core';
import { lifecycle } from './lifecycle';
import { i18n, localeKeys } from './locale';
import { getLocaleLanguage } from './utils/language';
import { start } from './commands/start';
import { dev } from './commands/dev';

export { defineConfig };

// eslint-disable-next-line react-hooks/rules-of-hooks
usePlugins([
  require.resolve('@modern-js/plugin-analyze/cli'),
  require.resolve('@modern-js/plugin-fast-refresh/cli'),
  require.resolve('@modern-js/plugin-polyfill/cli'),
]);

export default createPlugin(
  (() => {
    const locale = getLocaleLanguage();
    i18n.changeLanguage({ locale });

    lifecycle();

    return {
      commands({ program }: any) {
        program
          .command('dev')
          .usage('[options]')
          .description(i18n.t(localeKeys.command.dev.describe))
          .option('-c --config <config>', i18n.t(localeKeys.command.dev.config))
          .action(async () => {
            await dev();
          });

        program
          .command('build')
          .usage('[options]')
          .description(i18n.t(localeKeys.command.build.describe))
          .action(async () => {
            const { build } = await import('./commands/build');
            await build();
            // force exit after build.
            // eslint-disable-next-line no-process-exit
            process.exit(0);
          });

        program
          .command('start')
          .usage('[options]')
          .description(i18n.t(localeKeys.command.start.describe))
          .action(async () => {
            await start();
          });

        program
          .command('deploy')
          .usage('[options]')
          .description(i18n.t(localeKeys.command.deploy.describe))
          .action(async () => {
            const { build } = await import('./commands/build');
            await build();
            const { deploy } = await import('./commands/deploy');
            await deploy();
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
      async fileChange() {
        await cli.restart();
      },
    };
  }) as any,
  {
    post: [
      '@modern-js/plugin-analyze',
      '@modern-js/plugin-fast-refresh',
      '@modern-js/plugin-ssr',
      '@modern-js/plugin-state',
      '@modern-js/plugin-router',
      '@modern-js/plugin-polyfill',
    ],
  },
);
