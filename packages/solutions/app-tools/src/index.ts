import * as path from 'path';
import {
  createPlugin,
  defineConfig,
  usePlugins,
  cli,
  useAppContext,
} from '@modern-js/core';
import { cleanRequireCache } from '@modern-js/utils';
import { lifecycle } from './lifecycle';
import { i18n, localeKeys } from './locale';
import { getLocaleLanguage } from './utils/language';
import { start } from './commands/start';
import { dev } from './commands/dev';
import { closeServer } from './utils/createServer';
import type { DevOptions, BuildOptions } from './utils/types';

export { defineConfig };

// eslint-disable-next-line react-hooks/rules-of-hooks
usePlugins([
  require.resolve('@modern-js/plugin-analyze/cli'),
  require.resolve('@modern-js/plugin-fast-refresh/cli'),
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
          .option('-e --entry [entry...]', i18n.t(localeKeys.command.dev.entry))
          .action(async (options: DevOptions) => {
            await dev(options);
          });

        program
          .command('build')
          .usage('[options]')
          .description(i18n.t(localeKeys.command.build.describe))
          .option('--analyze', i18n.t(localeKeys.command.build.analyze))
          .action(async (options: BuildOptions) => {
            const { build } = await import('./commands/build');
            await build(options);
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
          .action(async (options: any) => {
            const { build } = await import('./commands/build');
            await build();
            const { deploy } = await import('./commands/deploy');
            await deploy(options);
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
        // eslint-disable-next-line react-hooks/rules-of-hooks
        const appContext = useAppContext();
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
  }) as any,
  {
    name: '@modern-js/app-tools',
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
