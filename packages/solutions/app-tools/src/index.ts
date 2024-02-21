import path from 'path';
import { lintPlugin } from '@modern-js/plugin-lint';
import {
  cleanRequireCache,
  emptyDir,
  Command,
  getCommand,
  getArgv,
  fs,
  NESTED_ROUTE_SPEC_FILE,
  newAction,
  upgradeAction,
} from '@modern-js/utils';
import { castArray } from '@modern-js/utils/lodash';
import { CliPlugin, PluginAPI } from '@modern-js/core';
import { getLocaleLanguage } from '@modern-js/plugin-i18n/language-detector';
import analyzePlugin from './analyze';
import initializePlugin from './initialize';
import { AppTools } from './types';
import { hooks } from './hooks';
import { i18n, localeKeys } from './locale';
import serverBuildPlugin from './plugins/serverBuild';
import type {
  DevOptions,
  BuildOptions,
  DeployOptions,
  InspectOptions,
} from './utils/types';
import { restart } from './utils/restart';
import { generateWatchFiles } from './utils/generateWatchFiles';

export { mergeConfig } from '@modern-js/core';
export { dev } from './commands';
export * from './defineConfig';
// eslint-disable-next-line import/export
export * from './types';

// eslint-disable-next-line import/export
export type { RuntimeUserConfig } from './types/config';

export const devCommand = async (
  program: Command,
  api: PluginAPI<AppTools<'shared'>>,
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
    .option('--web-only', i18n.t(localeKeys.command.dev.webOnly))
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
  api: PluginAPI<AppTools<'shared'>>,
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

export type AppToolsOptions = {
  /**
   * Specify which bundler to use for the build.
   * @default `webpack`
   * */
  bundler?: 'experimental-rspack' | 'webpack';
};

/**
 * The core package of the framework, providing CLI commands, build capabilities, configuration parsing and more.
 */
export const appTools = (
  options: AppToolsOptions = {
    bundler: 'webpack',
  },
): CliPlugin<AppTools<'shared'>> => ({
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

  usePlugins: [
    initializePlugin({
      bundler:
        options?.bundler === 'experimental-rspack' ? 'rspack' : 'webpack',
    }),
    analyzePlugin({
      bundler:
        options?.bundler === 'experimental-rspack' ? 'rspack' : 'webpack',
    }),
    serverBuildPlugin(),
    lintPlugin(),
  ],

  setup: api => {
    const appContext = api.useAppContext();
    api.setAppContext({
      ...appContext,
      toolsType: 'app-tools',
    });
    const nestedRoutes: Record<string, unknown> = {};

    const locale = getLocaleLanguage();
    i18n.changeLanguage({ locale });

    return {
      async beforeConfig() {
        const userConfig = api.useConfigContext();
        const appContext = api.useAppContext();
        if (userConfig.output?.tempDir) {
          api.setAppContext({
            ...appContext,
            internalDirectory: path.resolve(
              appContext.appDirectory,
              userConfig.output.tempDir,
            ),
          });
        }
      },
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
          .option(
            '-s --skip-build',
            i18n.t(localeKeys.command.shared.skipBuild),
          )
          .description(i18n.t(localeKeys.command.deploy.describe))
          .action(async (options: DeployOptions) => {
            if (!options.skipBuild) {
              const { build } = await import('./commands/build');
              await build(api);
            }

            const { deploy } = await import('./commands/deploy');
            await deploy(api, options);
            // eslint-disable-next-line no-process-exit
            process.exit(0);
          });

        program
          .command('new')
          .usage('[options]')
          .description(i18n.t(localeKeys.command.new.describe))
          .option(
            '--config-file <configFile>',
            i18n.t(localeKeys.command.shared.config),
          )
          .option('--lang <lang>', i18n.t(localeKeys.command.new.lang))
          .option(
            '-c, --config <config>',
            i18n.t(localeKeys.command.new.config),
          )
          .option('-d, --debug', i18n.t(localeKeys.command.new.debug), false)
          .option('--dist-tag <tag>', i18n.t(localeKeys.command.new.distTag))
          .option('--registry', i18n.t(localeKeys.command.new.registry))
          .option(
            '--no-need-install',
            i18n.t(localeKeys.command.shared.noNeedInstall),
          )
          .action(async (options: any) => {
            await newAction(
              {
                ...options,
                locale: options.lang || locale,
              },
              'mwa',
            );
          });

        program
          .command('inspect')
          .description('inspect the internal configs')
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

        program
          .command('upgrade')
          .allowUnknownOption()
          .action(async () => {
            await upgradeAction();
          });
      },

      async prepare() {
        const command = getCommand();
        if (command === 'deploy') {
          const isSkipBuild = ['-s', '--skip-build'].some(tag => {
            return getArgv().includes(tag);
          });
          // if skip build, do not clean dist path
          if (isSkipBuild) {
            return;
          }
        }

        // clean dist path before building
        if (
          command === 'dev' ||
          command === 'start' ||
          command === 'build' ||
          command === 'deploy'
        ) {
          const resolvedConfig = api.useResolvedConfigContext();
          if (resolvedConfig.output.cleanDistPath) {
            const appContext = api.useAppContext();
            await emptyDir(appContext.distDirectory);
          }
        }
      },

      async watchFiles() {
        const appContext = api.useAppContext();
        const config = api.useResolvedConfigContext();
        return await generateWatchFiles(appContext, config.source.configDir);
      },

      // 这里会被 core/initWatcher 监听的文件变动触发，如果是 src 目录下的文件变动，则不做 restart
      async fileChange(e: {
        filename: string;
        eventType: string;
        isPrivate: boolean;
      }) {
        const { filename, eventType, isPrivate } = e;

        if (!isPrivate && (eventType === 'change' || eventType === 'unlink')) {
          const { closeServer } = await import('./utils/createServer');
          await closeServer();
          await restart(api.useHookRunners(), filename);
        }
      },

      async beforeRestart() {
        cleanRequireCache([require.resolve('./analyze')]);
      },

      async modifyFileSystemRoutes({ entrypoint, routes }) {
        nestedRoutes[entrypoint.entryName] = routes;

        return {
          entrypoint,
          routes,
        };
      },

      async beforeGenerateRoutes({ entrypoint, code }) {
        const { distDirectory } = api.useAppContext();

        await fs.outputJSON(
          path.resolve(distDirectory, NESTED_ROUTE_SPEC_FILE),
          nestedRoutes,
        );

        return {
          entrypoint,
          code,
        };
      },
    };
  },
});

export default appTools;
