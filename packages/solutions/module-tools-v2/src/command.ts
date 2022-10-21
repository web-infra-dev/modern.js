import type { Command } from '@modern-js/utils';
import { createDebugger } from '@modern-js/utils';
import type { PluginAPI } from '@modern-js/core';
import type { ModuleToolsHooks } from './types/hooks';
import type { DevCommandOptions, BuildCommandOptions } from './types/command';

const debug = createDebugger('module-tools');

export const buildCommand = async (
  program: Command,
  api: PluginAPI<ModuleToolsHooks>,
) => {
  const local = await import('./locale');
  const { defaultTsConfigPath } = await import('./constants/dts');

  program
    .command('build')
    .usage('[options]')
    .description(local.i18n.t(local.localeKeys.command.build.describe))
    .option('-w, --watch', local.i18n.t(local.localeKeys.command.build.watch))
    .option(
      '--tsconfig [tsconfig]',
      local.i18n.t(local.localeKeys.command.build.tsconfig),
      defaultTsConfigPath,
    )
    .option(
      '-p, --platform [platform]',
      local.i18n.t(local.localeKeys.command.build.platform),
    )
    .option('--no-dts', local.i18n.t(local.localeKeys.command.build.dts))
    .option('--no-clear', local.i18n.t(local.localeKeys.command.build.no_clear))
    .option(
      '-c --config <config>',
      local.i18n.t(local.localeKeys.command.build.config),
    )
    .action(async (options: BuildCommandOptions) => {
      const { initModuleContext } = await import('./utils/context');
      const context = await initModuleContext(api);
      if (options.platform) {
        const { buildPlatform } = await import('./builder/platform');
        await buildPlatform(options, api, context);
        return;
      }

      const runner = api.useHookRunners();

      const { normalizeBuildConfig } = await import('./config/normalize');
      const resolvedBuildConfig = await normalizeBuildConfig(
        api,
        context,
        options,
      );

      debug('resolvedBuildConfig', resolvedBuildConfig);

      await runner.beforeBuild({ config: resolvedBuildConfig, options });
      const builder = await import('./builder');
      await builder.run(
        { cmdOptions: options, resolvedBuildConfig, context },
        api,
      );
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
      const { initModuleContext } = await import('./utils/context');
      const context = await initModuleContext(api);
      const { dev } = await import('./dev');
      await dev(options, devToolMetas, api, context);
    });

  for (const meta of devToolMetas) {
    if (!meta.subCommands) {
      continue;
    }

    for (const subCmd of meta.subCommands) {
      devProgram
        .command(subCmd)
        .action(async (options: DevCommandOptions = {}) => {
          const { initModuleContext } = await import('./utils/context');
          const context = await initModuleContext(api);
          await runner.beforeDevTask(meta);
          await meta.action(options, { isTsProject: context.isTsProject });
        });
    }
  }
};

export const newCommand = async (program: Command) => {
  const local = await import('./locale');

  program
    .command('new')
    .usage('[options]')
    .description(local.i18n.t(local.localeKeys.command.new.describe))
    .option(
      '-d, --debug',
      local.i18n.t(local.localeKeys.command.new.debug),
      false,
    )
    .option(
      '-c, --config <config>',
      local.i18n.t(local.localeKeys.command.new.config),
    )
    .option(
      '--dist-tag <tag>',
      local.i18n.t(local.localeKeys.command.new.distTag),
    )
    .option('--registry', local.i18n.t(local.localeKeys.command.new.registry))
    .action(async options => {
      const { ModuleNewAction } = await import('@modern-js/new-action');
      const { getLocaleLanguage } = await import('./utils/language');
      const locale = getLocaleLanguage();

      await ModuleNewAction({ ...options, locale });
    });
};

export const upgradCommand = async (program: Command) => {
  const { defineCommand } = await import('@modern-js/upgrade');
  defineCommand(program.command('upgrade'));
};
