import type { RsbuildPlugin } from '@rsbuild/core';
import type { Bundler } from '../../../types';
import type { BuilderOptions } from '../types';

export const builderPluginAdapterHooks = <B extends Bundler>(
  options: BuilderOptions<B>,
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
    api.modifyWebpackChain(async (chain, utils) => {
      await hooks?.modifyWebpackChain.call(chain, utils);
    });
    api.modifyWebpackConfig(async (config, utils) => {
      await hooks?.modifyWebpackConfig.call(config, utils);
    });
  },
});
