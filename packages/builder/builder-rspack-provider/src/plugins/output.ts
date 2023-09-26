import { posix } from 'path';
import {
  getDistPath,
  getFilename,
  applyBuilderOutputPlugin,
} from '@modern-js/builder-shared';
import type { BuilderPlugin } from '../types';

export const builderPluginOutput = (): BuilderPlugin => ({
  name: 'builder-plugin-output',

  setup(api) {
    applyBuilderOutputPlugin(api);

    api.modifyBundlerChain(async (chain, { CHAIN_ID }) => {
      const config = api.getNormalizedConfig();

      if (config.output.copy) {
        const { CopyRspackPlugin } = await import('@rspack/core');
        const { copy } = config.output;
        const options = Array.isArray(copy) ? { patterns: copy } : copy;

        chain.plugin(CHAIN_ID.PLUGIN.COPY).use(CopyRspackPlugin, [options]);
      }
    });

    api.modifyRspackConfig(async (rspackConfig, { isProd }) => {
      const config = api.getNormalizedConfig();

      const cssPath = getDistPath(config.output, 'css');
      const cssFilename = getFilename(config.output, 'css', isProd);

      rspackConfig.output ||= {};
      rspackConfig.output.cssFilename = posix.join(cssPath, cssFilename);
      rspackConfig.output.cssChunkFilename = posix.join(
        cssPath,
        `async/${cssFilename}`,
      );
    });
  },
});
