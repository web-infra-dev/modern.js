import type { CLIPluginAPI } from '@modern-js/plugin';
import type { AppTools } from '../types';
import { releaseCommandLock } from '../utils/devLock';
import { getServerPlugins } from '../utils/loadPlugins';
import type { DeployOptions } from '../utils/types';
import { build } from './build';

export const deploy = async (
  api: CLIPluginAPI<AppTools>,
  options: DeployOptions = {},
) => {
  const hooks = api.getHooks();

  const { appDirectory, metaName } = api.getAppContext();

  try {
    if (options.skipBuild) {
      // A skipped build still needs the server plugins that register deploy hooks.
      await getServerPlugins(api, metaName);
    } else {
      await build(api);
    }

    await hooks.onBeforeDeploy.call(options);
    await hooks.deploy.call();
    await hooks.onAfterDeploy.call(options);
  } finally {
    // Deploy reads dist for its whole duration (including --skip-build), so
    // the exclusive lock taken in `onPrepare` is held until here.
    releaseCommandLock(appDirectory, metaName, 'deploy');
  }
};
