import { join } from 'path';
import {
  IMAGE_EXTENSIONS,
  getRegExpForExts,
  getDataUrlCondition,
} from '../shared';
import type { BuilderPlugin } from '../types';

export const PluginImage = (): BuilderPlugin => ({
  name: 'web-builder-plugin-image',

  setup(api) {
    api.modifyWebpackChain((chain, { isProd, CHAIN_ID }) => {
      const config = api.getBuilderConfig();
      const regExp = getRegExpForExts(IMAGE_EXTENSIONS);

      const { distPath } = config.output || {};
      const distDir =
        (typeof distPath === 'object' && distPath.image) || 'image';
      const filename = isProd ? '[name].[contenthash:8][ext]' : '[name][ext]';

      chain.module
        .rule(CHAIN_ID.RULE.IMAGE)
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
