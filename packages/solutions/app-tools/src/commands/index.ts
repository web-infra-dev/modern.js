import { PluginAPI } from '@modern-js/core';
import { Command, newAction, upgradeAction } from '@modern-js/utils';
import { castArray } from '@rsbuild/shared';
import { AppTools } from '../types';
import { i18n, localeKeys } from '../locale';
import type {
  BuildOptions,
  DeployOptions,
  DevOptions,
  InspectOptions,
} from '../utils/types';

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
      const { dev } = await import('./dev');
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
      const { build } = await import('./build');
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

export const serverCommand = (
  program: Command,
  api: PluginAPI<AppTools<'shared'>>,
) => {
  program
    .command('serve')
    .usage('[options]')
    .description(i18n.t(localeKeys.command.serve.describe))
    .option('--api-only', i18n.t(localeKeys.command.dev.apiOnly))
    .option('-c --config <config>', i18n.t(localeKeys.command.shared.config))
    .action(async () => {
      const { start } = await import('./serve');
      await start(api);
    });
};

export const deployCommand = (
  program: Command,
  api: PluginAPI<AppTools<'shared'>>,
) => {
  program
    .command('deploy')
    .usage('[options]')
    .option('-c --config <config>', i18n.t(localeKeys.command.shared.config))
    .option('-s --skip-build', i18n.t(localeKeys.command.shared.skipBuild))
    .description(i18n.t(localeKeys.command.deploy.describe))
    .action(async (options: DeployOptions) => {
      if (!options.skipBuild) {
        const { build } = await import('./build');
        await build(api);
      }

      const { deploy } = await import('./deploy');
      await deploy(api, options);
      // eslint-disable-next-line no-process-exit
      process.exit(0);
    });
};

export const newCommand = (program: Command, locale: string) => {
  program
    .command('new')
    .usage('[options]')
    .description(i18n.t(localeKeys.command.new.describe))
    .option(
      '--config-file <configFile>',
      i18n.t(localeKeys.command.shared.config),
    )
    .option('--lang <lang>', i18n.t(localeKeys.command.new.lang))
    .option('-c, --config <config>', i18n.t(localeKeys.command.new.config))
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
};

export const inspectCommand = (
  program: Command,
  api: PluginAPI<AppTools<'shared'>>,
) => {
  program
    .command('inspect')
    .description('inspect the internal configs')
    .option(
      `--env <env>`,
      i18n.t(localeKeys.command.inspect.env),
      'development',
    )
    .option('--output <output>', i18n.t(localeKeys.command.inspect.output), '/')
    .option('--verbose', i18n.t(localeKeys.command.inspect.verbose))
    .option('-c --config <config>', i18n.t(localeKeys.command.shared.config))
    .action(async (options: InspectOptions) => {
      const { inspect } = await import('./inspect');
      inspect(api, options);
    });
};

export const upgradeCommand = (program: Command) => {
  program
    .command('upgrade')
    .allowUnknownOption()
    .option('-h --help', 'Show help') // In order to upgrade help work.
    .action(async () => {
      await upgradeAction();
    });
};
