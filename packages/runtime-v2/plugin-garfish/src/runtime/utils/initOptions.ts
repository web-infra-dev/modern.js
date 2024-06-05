import { logger } from '../../utils';
import { Manifest, ModulesInfo, Options } from '../useModuleApps';

export async function initOptions(manifest: Manifest = {}, options: Options) {
  let apps: ModulesInfo = options.apps || [];

  // use manifest modules
  if (manifest?.modules) {
    if (manifest?.modules.length > 0) {
      apps = manifest?.modules;
    }
    logger('manifest modules', apps);
  }

  // get module list
  if (manifest?.getAppList) {
    const getAppList = await manifest?.getAppList(manifest);
    if (getAppList.length > 0) {
      apps = getAppList;
    }
    logger('getAppList modules', apps);
  }

  // get inject modules list
  if (
    window?.modern_manifest?.modules &&
    window?.modern_manifest?.modules.length > 0
  ) {
    apps = window?.modern_manifest?.modules;
    logger('modern_manifest', apps);
  }

  return {
    ...options,
    apps,
  };
}
