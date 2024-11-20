import type { AppTools } from '../new/types';
import { getServerPlugins } from '../utils/loadPlugins';

export const deploy = async (api: AppTools<'shared'>, options: any) => {
  const hooks = api.getHooks();

  const { metaName } = api.getAppContext();

  // deploy command need get all plugins
  await getServerPlugins(api, metaName);

  await hooks.onBeforeDeploy.call(options);
  await hooks.deploy.call(options);
  await hooks.onAfterDeploy.call(options);
};
