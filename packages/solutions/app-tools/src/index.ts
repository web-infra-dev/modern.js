import path from 'path';
import LintPlugin from '@modern-js/plugin-lint';
import { cleanRequireCache, emptyDir, Import, Command } from '@modern-js/utils';
import { castArray } from '@modern-js/utils/lodash';
import { CliPlugin, PluginAPI } from '@modern-js/core';
import AnalyzePlugin from './analyze';
import InitializePlugin from './initialize';
import { AppTools } from './types';
import { hooks } from './hooks';
import { i18n, localeKeys } from './locale';
import { getLocaleLanguage } from './utils/language';
import type {
  DevOptions,
  BuildOptions,
  DeployOptions,
  InspectOptions,
} from './utils/types';
import { getCommand } from './utils/commands';
import { restart } from './utils/restart';

export * from './defineConfig';
export * from './types';

const upgradeModel: typeof import('@modern-js/upgrade') = Import.lazy(
  '@modern-js/upgrade',
  require,
);

export const devCommand = async (
  program: Command,
  api: PluginAPI<AppTools>,
) => {
  const runner = api.useHookRunners();
  const devToolMetas = await runner.registerDev();

  const devProgram = program
    .command('dev')
    .alias('start')
    .usage('[options]')
    .description(i18n.t(localeKeys.command.dev.describe))
    .option('-c --config <config>', i18n.t(localeKeys.command.shared.config))
    .option('-e --entry [entry...]', i18n.t(localeKeys.command.dev.entry))
    .option('--analyze', i18n.t(localeKeys.command.shared.analyze))
    .option('--api-only', i18n.t(localeKeys.command.dev.apiOnly))
    .action(async (options: DevOptions) => {
      const { dev } = await import('./commands/dev');
      await dev(api, options);
    });

  for (const meta of devToolMetas) {
    if (!meta.subCommands) {
      continue;
    }

    for (const subCmd of meta.subCommands) {
      devProgram.command(subCmd).action(async (options: DevOptions = {}) => {
        const { appDirectory } = api.useAppContext();
        const { isTypescript } = await import('@modern-js/utils');

        await runner.beforeDevTask(meta);
        await meta.action(options, {
          isTsProject: isTypescript(appDirectory),
        });
      });
    }
  }
};

export const buildCommand = async (
  program: Command,
  api: PluginAPI<AppTools>,
) => {
  const runner = api.useHookRunners();
  const platformBuilders = await runner.registerBuildPlatform();

  const buildProgram = program
    .command('build')
    .usage('[options]')
    .description(i18n.t(localeKeys.command.build.describe))
    .option('-c --config <config>', i18n.t(localeKeys.command.shared.config))
    .option('--analyze', i18n.t(localeKeys.command.shared.analyze))
    .action(async (options: BuildOptions) => {
      const { build } = await import('./commands/build');
      await build(api, options);
      // force exit after build.
      // eslint-disable-next-line no-process-exit
      process.exit(0);
    });

  for (const platformBuilder of platformBuilders) {
    const platforms = castArray(platformBuilder.platform);
    for (const platform of platforms) {
      buildProgram.command(platform).action(async () => {
        const { appDirectory } = api.useAppContext();
        const { isTypescript } = await import('@modern-js/utils');

        await runner.beforeBuildPlatform(platformBuilders);
        await platformBuilder.build(platform, {
          isTsProject: isTypescript(appDirectory),
        });
      });
    }
  }
};

export default (): CliPlugin<AppTools> => ({
  name: '@modern-js/app-tools',

  post: [
    '@modern-js/plugin-initialize',
    '@modern-js/plugin-analyze',
    '@modern-js/plugin-ssr',
    '@modern-js/plugin-document',
    '@modern-js/plugin-state',
    '@modern-js/plugin-router',
    '@modern-js/plugin-router-v5',
    '@modern-js/plugin-polyfill',
  ],

  registerHook: hooks,

  usePlugins: [InitializePlugin(), AnalyzePlugin(), LintPlugin()],

  setup: api => {
    const locale = getLocaleLanguage();
    i18n.changeLanguage({ locale });

    return {
      async commands({ program }) {
        await devCommand(program, api);

        await buildCommand(program, api);

        program
          .command('serve')
          .usage('[options]')
          .description(i18n.t(localeKeys.command.serve.describe))
          .option('--api-only', i18n.t(localeKeys.command.dev.apiOnly))
          .option(
            '-c --config <config>',
            i18n.t(localeKeys.command.shared.config),
          )
          .action(async () => {
            const { start } = await import('./commands/serve');
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
          .option('--verbose', i18n.t(localeKeys.command.inspect.verbose))
          .option(
            '-c --config <config>',
            i18n.t(localeKeys.command.shared.config),
          )
          .action(async (options: InspectOptions) => {
            const { inspect } = await import('./commands/inspect');
            inspect(api, options);
          });

        upgradeModel.defineCommand(program.command('upgrade'));
      },

      async prepare() {
        const command = getCommand();
        if (command === 'dev' || command === 'build') {
          const appContext = api.useAppContext();
          await emptyDir(appContext.distDirectory);
        }
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
          await restart(api.useHookRunners(), filename);
        }
      },

      async beforeRestart() {
        cleanRequireCache([require.resolve('./analyze')]);
      },
    };
  },
});
