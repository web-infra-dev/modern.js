import type { Command } from '@modern-js/utils';
import type { PluginAPI } from '@modern-js/core';
import type { ModuleTools } from './types';
import type { DevCommandOptions, BuildCommandOptions } from './types/command';
import { i18n, localeKeys } from './locale';
import { initModuleContext } from './utils/context';

export const buildCommand = async (
  program: Command,
  api: PluginAPI<ModuleTools>,
) => {
  program
    .command('build')
    .usage('[options]')
    .description(i18n.t(localeKeys.command.build.describe))
    .option('-w, --watch', i18n.t(localeKeys.command.build.watch))
    .option('--tsconfig [tsconfig]', i18n.t(localeKeys.command.build.tsconfig))
    .option(
      '-p, --platform [platform...]',
      i18n.t(localeKeys.command.build.platform),
    )
    .option('--no-dts', i18n.t(localeKeys.command.build.dts))
    .option('--no-clear', i18n.t(localeKeys.command.build.noClear))
    .option('-c --config <config>', i18n.t(localeKeys.command.shared.config))
    .action(async (options: BuildCommandOptions) => {
      const context = await initModuleContext(api);
      const { build } = await import('./build');
      await build(api, options, context);
    });
};

export const devCommand = async (
  program: Command,
  api: PluginAPI<ModuleTools>,
) => {
  const runner = api.useHookRunners();
  const devToolMetas = await runner.registerDev();

  await runner.beforeDev(devToolMetas);

  const devProgram = program
    .command('dev')
    .usage('[options]')
    .description(i18n.t(localeKeys.command.dev.describe))
    .option('--tsconfig [tsconfig]', i18n.t(localeKeys.command.dev.tsconfig))
    .action(async (options: DevCommandOptions) => {
      const context = await initModuleContext(api);
      const { dev } = await import('./dev');
      await dev(options, devToolMetas, api, context);
    });

  for (const meta of devToolMetas) {
    if (!meta.subCommands) {
      continue;
    }

    for (const subCmd of meta.subCommands) {
      devProgram.command(subCmd).action(async (options: DevCommandOptions) => {
        const context = await initModuleContext(api);

        // TODO: watch build
        // const { ensureFirstBuild, watchBuild } = await import('./dev');
        // await ensureFirstBuild(api, context, options, {
        //   disableRunBuild: meta.disableRunBuild ?? false,
        //   appDirectory: context.appDirectory,
        // });

        await runner.beforeDevTask(meta);
        await meta.action(options, { isTsProject: context.isTsProject });
        // TODO: watch build
        // await watchBuild(api, context, options, {
        //   disableRunBuild: meta.disableRunBuild ?? false,
        //   appDirectory: context.appDirectory,
        // });
      });
    }
  }
};

export const newCommand = async (program: Command) => {
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
    .action(async options => {
      const { ModuleNewAction } = await import('@modern-js/new-action');
      const { getLocaleLanguage } = await import(
        '@modern-js/plugin-i18n/language-detector'
      );

      const locale = getLocaleLanguage();

      await ModuleNewAction({ ...options, locale: options.lang || locale });
    });
};

export const upgradeCommand = async (program: Command) => {
  const { defineCommand } = await import('@modern-js/upgrade');
  defineCommand(
    program
      .command('upgrade')
      .option('-c --config <config>', i18n.t(localeKeys.command.shared.config))
      .option(
        '--no-need-install',
        i18n.t(localeKeys.command.shared.noNeedInstall),
      ),
  );
};
