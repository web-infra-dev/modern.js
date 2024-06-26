import { chokidar } from '@modern-js/utils';
import { Plugin } from '../types';
import { getConfigFilenames, loadConfigFiles } from '../utils/config';
import { updateContext } from '../options';

export const pluginWatcher: Plugin = {
  async setup(api) {
    const frameworkApi = await api.setupFramework();
    const basename = `${api.context.def.name.shortName}.runtime.json`;
    const appCtx = frameworkApi.useAppContext();
    const watcher = chokidar.watch(getConfigFilenames(basename), {
      cwd: appCtx.appDirectory,
      ignorePermissionErrors: true,
    });
    const refreshStoragePreset = async () => {
      const configs = await loadConfigFiles(basename, appCtx.appDirectory);
      if (!configs) return;
      api.context.storagePresets = [];
      updateContext(api.context, ...configs);
    };
    watcher.on('add', refreshStoragePreset);
    watcher.on('change', refreshStoragePreset);
    watcher.on('unlink', refreshStoragePreset);

    api.hooks.hook('cleanup', () => {
      watcher.close();
    });
  },
};
