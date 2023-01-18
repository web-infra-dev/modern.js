import type { CliPlugin } from '@modern-js/core';
import type { ModuleTools } from './types';
import { registerHook } from './hooks';
import { getPlugins } from './plugins';

export const cli = (): CliPlugin<ModuleTools> => ({
  name: '@modern-js/module-tools',
  registerHook,
  usePlugins: getPlugins(process.argv.slice(2)[0]),
  setup,
});

const setup: CliPlugin<ModuleTools>['setup'] = async api => {
  const prepare = async () => {
    const { initLocalLanguage } = await import('./utils/language');
    await initLocalLanguage();

    const appContext = api.useAppContext();
    const { fs, dotenv } = await import('@modern-js/utils');
    dotenv.config();
    // remove '/node_modules/.modern-js'
    await fs.emptydir(appContext.internalDirectory);

    const hookRunners = api.useHookRunners();
    await hookRunners.addRuntimeExports();

    const { addExitListener } = await import('./utils/onExit');
    await addExitListener(async () => {
      await hookRunners.afterDev();
    });
  };

  const validateSchema = async () => {
    const { schema, legacySchema } = await import('./config/schema');
    const { isLegacyUserConfig } = await import('./utils/config');
    const userConfig = api.useConfigContext();
    return isLegacyUserConfig(userConfig as { legacy?: boolean })
      ? legacySchema
      : schema;
  };

  return {
    prepare,
    validateSchema,
    async commands({ program }) {
      const { buildCommand, devCommand, newCommand, upgradCommand } =
        await import('./command');
      await buildCommand(program, api);
      await devCommand(program, api);
      await newCommand(program);
      await upgradCommand(program);
    },
  };
};
