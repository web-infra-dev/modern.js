import type { CLIPluginAPI } from '@modern-js/plugin';
import type { AppTools } from '../types';
import { releaseCommandLock } from '../utils/devLock';
import { getServerPlugins } from '../utils/loadPlugins';
import type { DeployOptions } from '../utils/types';

export const deploy = async (
  api: CLIPluginAPI<AppTools>,
  options: DeployOptions = {},
) => {
  const hooks = api.getHooks();

  const { appDirectory, metaName } = api.getAppContext();

  try {
    // deploy command need get all plugins
    await getServerPlugins(api, metaName);

    await hooks.onBeforeDeploy.call(options);
    await hooks.deploy.call();
    await hooks.onAfterDeploy.call(options);
  } finally {
    releaseCommandLock(appDirectory, metaName, 'deploy');
  }
};
