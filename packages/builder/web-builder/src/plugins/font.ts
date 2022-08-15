import { join } from 'path';
import {
  FONT_DIST_DIR,
  FONT_EXTENSIONS,
  getRegExpForExts,
  getDataUrlCondition,
} from '../shared';
import type { BuilderPlugin } from '../types';

export const PluginFont = (): BuilderPlugin => ({
  name: 'web-builder-plugin-font',

  setup(api) {
    api.modifyWebpackChain((chain, { isProd, CHAIN_ID }) => {
      const config = api.getBuilderConfig();
      const regExp = getRegExpForExts(FONT_EXTENSIONS);

      const { distPath } = config.output || {};
      const distDir =
        (typeof distPath === 'object' && distPath.font) || FONT_DIST_DIR;
      const filename = isProd ? '[name].[contenthash:8][ext]' : '[name][ext]';

      chain.module
        .rule(CHAIN_ID.RULE.FONT)
        .test(regExp)
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
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
