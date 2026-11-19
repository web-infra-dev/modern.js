import type { RsbuildPlugin } from '@rsbuild/core';

/**
 * Enable Rspack's Rust native watcher by default.
 * Users can opt out via `tools.rspack`, which is applied after this hook.
 */
export const pluginNativeWatcher = (): RsbuildPlugin => ({
  name: 'builder:native-watcher',

  setup(api) {
    api.modifyRspackConfig(config => {
      config.experiments ??= {};
      config.experiments.nativeWatcher ??= true;
    });
  },
});
