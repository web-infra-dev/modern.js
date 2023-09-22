import type { CliPlugin } from '@modern-js/core';
import { dotenv, fs } from '@modern-js/utils';
import type { ModuleTools } from './types';
import { registerHook } from './hooks';
import { getPlugins } from './plugins';
import {
  buildCommand,
  devCommand,
  newCommand,
  upgradeCommand,
} from './command';
import { isLegacyUserConfig } from './config/merge';
import { addExitListener } from './utils/onExit';
import { legacySchema } from './config/legacySchema';
import { schema } from './config/schema';

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

  const validateSchema = async () => {
    const userConfig = api.useConfigContext();
    return isLegacyUserConfig(userConfig as { legacy?: boolean })
      ? legacySchema
      : schema;
  };

  return {
    prepare,
    validateSchema,
    async commands({ program }) {
      await buildCommand(program, api);
      await devCommand(program, api);
      await newCommand(program);
      await upgradeCommand(program);
    },
  };
};
