import type { Command } from '@modern-js/utils';
import type { PluginAPI } from '@modern-js/core';
import type { ModuleToolsHooks } from './types/hooks';
import type { DevCommandOptions, BuildCommandOptions } from './types/command';

export const buildCommand = async (
  program: Command,
  api: PluginAPI<ModuleToolsHooks>,
) => {
  const local = await import('./locale');

  program
    .command('build')
    .usage('[options]')
    .description(local.i18n.t(local.localeKeys.command.build.describe))
    .option('-w, --watch', local.i18n.t(local.localeKeys.command.build.watch))
    .option(
      '--tsconfig [tsconfig]',
      local.i18n.t(local.localeKeys.command.build.tsconfig),
      './tsconfig.json',
    )
    .option(
      '--style-only',
      local.i18n.t(local.localeKeys.command.build.style_only),
    )
    .option(
      '-p, --platform [platform]',
      local.i18n.t(local.localeKeys.command.build.platform),
    )
    // @deprecated
    // The `--no-tsc` option has been superceded by the `--no-dts` option.
    .option('--no-tsc', local.i18n.t(local.localeKeys.command.build.no_tsc))
    .option('--dts', local.i18n.t(local.localeKeys.command.build.dts))
    .option('--no-clear', local.i18n.t(local.localeKeys.command.build.no_clear))
    .option(
      '-c --config <config>',
      local.i18n.t(local.localeKeys.command.build.config),
    )
    .action(async (options: BuildCommandOptions) => {
      const runner = api.useHookRunners();

      const { normalizeBuildConfig } = await import('./config/normalize');
      const resolvedBuildConfig = normalizeBuildConfig(api);
      await runner.beforeBuild({ config: resolvedBuildConfig, options });

      const builder = await import('./builder');
      await builder.run(options, resolvedBuildConfig, api);
    });
};

export const devCommand = async (
  program: Command,
  api: PluginAPI<ModuleToolsHooks>,
) => {
  const local = await import('./locale');
  const runner = api.useHookRunners();
  const devToolMetas = await runner.registerDev();

  await runner.beforeDev(devToolMetas);

  const devProgram = program
    .command('dev')
    .usage('[options]')
    .description(local.i18n.t(local.localeKeys.command.dev.describe))
    .action(async (options: DevCommandOptions = {}) => {
      console.info('dev', options, api);
    });

  for (const meta of devToolMetas) {
    if (!meta.subCommands) {
      continue;
    }

    for (const subCmd of meta.subCommands) {
      devProgram
        .command(subCmd)
        .action(async (options: DevCommandOptions = {}) => {
          await runner.beforeDevTask(meta);
          await meta.action(options);
        });
    }
  }
};
