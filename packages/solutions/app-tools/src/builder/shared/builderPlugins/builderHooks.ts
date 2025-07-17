import type { RsbuildPlugin } from '@rsbuild/core';
import type { BuilderOptions } from '../types';

export const builderPluginAdapterHooks = (
  options: BuilderOptions,
): RsbuildPlugin => ({
  name: 'builder-plugin-support-modern-hooks',
  setup(api) {
    const _internalContext = options.appContext._internalContext;
    const hooks = _internalContext.pluginAPI?.getHooks();
    api.modifyBundlerChain(async (chain, utils) => {
      await hooks?.modifyBundlerChain.call(chain, utils);
    });
    api.modifyRsbuildConfig(async (config, utils) => {
      await hooks?.modifyRsbuildConfig.call(config, utils);
    });
    api.modifyRspackConfig(async (config, utils) => {
      await hooks?.modifyRspackConfig.call(config, utils);
    });
  },
});
