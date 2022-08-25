import { join } from 'path';
import {
  getDistPath,
  FONT_EXTENSIONS,
  getRegExpForExts,
  getDataUrlCondition,
} from '../shared';
import type { BuilderPlugin } from '../types';

export const PluginFont = (): BuilderPlugin => ({
  name: 'webpack-builder-plugin-font',

  setup(api) {
    api.modifyWebpackChain((chain, { isProd, CHAIN_ID }) => {
      const config = api.getBuilderConfig();
      const regExp = getRegExpForExts(FONT_EXTENSIONS);

      const distDir = getDistPath(config, 'font');
      const filename = isProd ? '[name].[contenthash:8][ext]' : '[name][ext]';

      chain.module
        .rule(CHAIN_ID.RULE.FONT)
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
