import { TARGET_ID_MAP } from '@modern-js/builder-shared';
import type { BuilderPlugin } from '../types';
import { ProgressPlugin } from '@rspack/core';

export const builderPluginProgress = (): BuilderPlugin => ({
  name: 'builder-plugin-progress',
  setup(api) {
    api.modifyBundlerChain(async (chain, { target, CHAIN_ID }) => {
      const config = api.getNormalizedConfig();
      const options = config.dev.progressBar;

      if (!options) {
        return;
      }

      chain.plugin(CHAIN_ID.PLUGIN.PROGRESS).use(ProgressPlugin, [
        {
          prefix: TARGET_ID_MAP[target],
          ...(options === true ? {} : options),
        },
      ]);
    });
  },
});
