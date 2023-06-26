import { posix } from 'path';
import { CSSExtractOptions } from '../types/thirdParty/css';
import {
  getDistPath,
  getFilename,
  isUseCssExtract,
  applyBuilderOutputPlugin,
} from '@modern-js/builder-shared';
import type { BuilderPlugin } from '../types';

export const builderPluginOutput = (): BuilderPlugin => ({
  name: 'builder-plugin-output',

  setup(api) {
    applyBuilderOutputPlugin(api);

    api.modifyWebpackChain(async (chain, { isProd, target, CHAIN_ID }) => {
      const config = api.getNormalizedConfig();

      const cssPath = getDistPath(config.output, 'css');

      // css output
      if (isUseCssExtract(config, target)) {
        const { default: MiniCssExtractPlugin } = await import(
          'mini-css-extract-plugin'
        );
        const { applyOptionsChain } = await import('@modern-js/utils');
        const extractPluginOptions = applyOptionsChain(
          {},
          (config.tools.cssExtract as CSSExtractOptions)?.pluginOptions || {},
        );

        const cssFilename = getFilename(config.output, 'css', isProd);

        chain
          .plugin(CHAIN_ID.PLUGIN.MINI_CSS_EXTRACT)
          .use(MiniCssExtractPlugin, [
            {
              filename: posix.join(cssPath, cssFilename),
              chunkFilename: posix.join(cssPath, `async/${cssFilename}`),
              ignoreOrder: true,
              ...extractPluginOptions,
            },
          ]);
      }
    });
  },
});
