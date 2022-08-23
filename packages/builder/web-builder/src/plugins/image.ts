import { join } from 'path';
import {
  getDistPath,
  getRegExpForExts,
  IMAGE_EXTENSIONS,
  getDataUrlCondition,
} from '../shared';
import type { BuilderPlugin } from '../types';

export const PluginImage = (): BuilderPlugin => ({
  name: 'web-builder-plugin-image',

  setup(api) {
    api.modifyWebpackChain((chain, { isProd, CHAIN_ID }) => {
      const config = api.getBuilderConfig();
      const regExp = getRegExpForExts(IMAGE_EXTENSIONS);
      const distDir = getDistPath(config, 'image');
      const filename = isProd ? '[name].[contenthash:8][ext]' : '[name][ext]';

      chain.module
        .rule(CHAIN_ID.RULE.IMAGE)
        .test(regExp)
        // @ts-expect-error webpack-chain has incorrect type for `rule.type`
        .type('asset')
        .parser({
          dataUrlCondition: getDataUrlCondition(config.output?.dataUriLimit),
        })
        .set('generator', {
          filename: join(distDir, filename),
        });
    });
  },
});
