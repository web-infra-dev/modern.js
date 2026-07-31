import type { CLIPluginAPI } from '@modern-js/plugin';
import type { AppTools } from '../types';
import { getServerPlugins } from '../utils/loadPlugins';
import type { DeployOptions } from '../utils/types';
import { build } from './build';

export const deploy = async (
  api: CLIPluginAPI<AppTools>,
  options: DeployOptions = {},
) => {
  const hooks = api.getHooks();

  const { metaName } = api.getAppContext();

  if (options.skipBuild) {
    // A skipped build still needs the server plugins that register deploy hooks.
    await getServerPlugins(api, metaName);
  } else {
    await build(api);
  }

  await hooks.onBeforeDeploy.call(options);
  await hooks.deploy.call();
  await hooks.onAfterDeploy.call(options);
};
