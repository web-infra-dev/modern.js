import type { CliPlugin } from '@modern-js/core';
import type { ModuleToolsHooks } from './types/hooks';
import { registerHook } from './hooks';
import { getPlugins } from './plugins';

export const cli = (): CliPlugin<ModuleToolsHooks> => ({
  name: '@modern-js/module-tools-v2',
  registerHook,
  usePlugins: getPlugins(process.argv.slice(2)[0]),
  setup,
});

const setup: CliPlugin<ModuleToolsHooks>['setup'] = async api => {
  const prepare = async () => {
    await (await import('./utils/language')).initLocalLanguage();
    const { fs, dotenv } = await import('@modern-js/utils');

    dotenv.config();

    const appContext = api.useAppContext();
    await fs.emptydir(appContext.internalDirectory);

    const hookRunners = api.useHookRunners();
    await hookRunners.addRuntimeExports();

    const { addExitListener } = await import('./utils/onExit');

    await addExitListener(async () => {
      await hookRunners.afterDev();
    });
  };

  const validateSchema = async () => {
    const { schema } = await import('./config/schema');
    return schema;
  };

  return {
    prepare,
    validateSchema,
    async commands({ program }) {
      const { buildCommand, devCommand } = await import('./command');
      const { initModuleContext } = await import('./utils/context');
      const context = await initModuleContext(api);
      await buildCommand(program, api, context);
      await devCommand(program, api, context);
    },
  };
};
