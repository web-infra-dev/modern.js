import type { RsbuildPlugin } from '@rsbuild/core';

/**
 * Enable native watcher for Rspack.
 */
export const pluginNativeWatcher = (): RsbuildPlugin => ({
  name: 'builder:native-watcher',

  setup(api) {
    api.modifyRspackConfig(config => {
      config.experiments = {
        ...(config.experiments || {}),
        nativeWatcher: true,
      };
    });
  },
});
