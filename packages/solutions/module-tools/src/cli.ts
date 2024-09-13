import type { CliPlugin } from '@modern-js/core';
import { fs, dotenv, logger } from '@modern-js/utils';
import {
  buildCommand,
  devCommand,
  newCommand,
  upgradeCommand,
} from './command';
import { registerHook } from './hooks';
import { getPlugins } from './plugins';
import type { ModuleTools } from './types';
import { addExitListener } from './utils/onExit';

export const moduleTools = (): CliPlugin<ModuleTools> => ({
  name: '@modern-js/module-tools',
  registerHook,
  usePlugins: getPlugins(process.argv.slice(2)[0]),
  setup,
});

const setup: CliPlugin<ModuleTools>['setup'] = async api => {
  const appContext = api.useAppContext();
  api.setAppContext({
    ...appContext,
    toolsType: 'module-tools',
  });

  const prepare = async () => {
    const local = await import('./locale');
    const { getLocaleLanguage } = await import(
      '@modern-js/plugin-i18n/language-detector'
    );
    const locale = getLocaleLanguage();
    local.i18n.changeLanguage({ locale });

    const appContext = api.useAppContext();
    dotenv.config();
    // remove '/node_modules/.modern-js'
    await fs.emptydir(appContext.internalDirectory);

    const hookRunners = api.useHookRunners();
    await hookRunners.addRuntimeExports();

    await addExitListener(async () => {
      await hookRunners.afterDev();
    });
  };

  return {
    prepare,
    async commands({ program }) {
      await buildCommand(program, api);
      await devCommand(program, api);
      await newCommand(program);
      await upgradeCommand(program);
      program
        .command('lint [...files]')
        .allowUnknownOption()
        .description('Deprecated')
        .action(() => {
          logger.warn(
            'The "modern lint" command is deprecated, please use "eslint" or "biome" instead.',
          );
        });

      // @deprecated
      // Can be removed in the next major version
      program
        .command('pre-commit')
        .description('Deprecated')
        .action(() => {
          logger.warn(
            'The "modern pre-commit" command is deprecated, please use "lint-staged" instead.',
          );
        });
    },
  };
};
