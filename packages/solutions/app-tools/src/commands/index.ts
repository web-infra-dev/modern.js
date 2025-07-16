import type { CLIPluginAPI } from '@modern-js/plugin-v2';
import { castArray } from '@modern-js/uni-builder';
import { type Command, newAction, upgradeAction } from '@modern-js/utils';
import { i18n, localeKeys } from '../locale';
import type { AppTools } from '../types';
import type {
  BuildOptions,
  DeployOptions,
  DevOptions,
  InspectOptions,
} from '../utils/types';

export const devCommand = async (
  program: Command,
  api: CLIPluginAPI<AppTools>,
) => {
  program
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
      const { dev } = await import('./dev.js');
      await dev(api, options);
    });
};

export const buildCommand = async (
  program: Command,
  api: CLIPluginAPI<AppTools>,
) => {
  program
    .command('build')
    .usage('[options]')
    .description(i18n.t(localeKeys.command.build.describe))
    .option('-c --config <config>', i18n.t(localeKeys.command.shared.config))
    .option('--analyze', i18n.t(localeKeys.command.shared.analyze))
    .option('-w --watch', i18n.t(localeKeys.command.build.watch))
    .action(async (options: BuildOptions) => {
      const { build } = await import('./build.js');
      await build(api, options);
    });
};

export const serverCommand = (
  program: Command,
  api: CLIPluginAPI<AppTools>,
) => {
  program
    .command('serve')
    .usage('[options]')
    .description(i18n.t(localeKeys.command.serve.describe))
    .option('--api-only', i18n.t(localeKeys.command.dev.apiOnly))
    .option('-c --config <config>', i18n.t(localeKeys.command.shared.config))
    .action(async () => {
      const { serve } = await import('./serve.js');
      await serve(api);
    });
};

export const deployCommand = (
  program: Command,
  api: CLIPluginAPI<AppTools>,
) => {
  program
    .command('deploy')
    .usage('[options]')
    .option('-c --config <config>', i18n.t(localeKeys.command.shared.config))
    .option('-s --skip-build', i18n.t(localeKeys.command.shared.skipBuild))
    .description(i18n.t(localeKeys.command.deploy.describe))
    .action(async (options: DeployOptions) => {
      if (!options.skipBuild) {
        const { build } = await import('./build.js');
        await build(api);
      }

      const { deploy } = await import('./deploy.js');
      await deploy(api, options);
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
  api: CLIPluginAPI<AppTools>,
) => {
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
      './',
    )
    .option('--verbose', i18n.t(localeKeys.command.inspect.verbose))
    .option('-c --config <config>', i18n.t(localeKeys.command.shared.config))
    .action(async (options: InspectOptions) => {
      const { inspect } = await import('./inspect.js');
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
