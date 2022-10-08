import { join } from 'path';
import {
  getDistPath,
  getFilename,
  getRegExpForExts,
  IMAGE_EXTENSIONS,
  getDataUrlCondition,
} from '../shared';
import type { BuilderPlugin } from '../types';

export const PluginImage = (): BuilderPlugin => ({
  name: 'builder-plugin-image',

  setup(api) {
    api.modifyWebpackChain((chain, { isProd, CHAIN_ID }) => {
      const config = api.getBuilderConfig();
      const regExp = getRegExpForExts(IMAGE_EXTENSIONS);
      const distDir = getDistPath(config, 'image');
      const filename = getFilename(config, 'image', isProd);

      chain.module
        .rule(CHAIN_ID.RULE.IMAGE)
        .test(regExp)
        .type('asset')
        .parser({
          dataUrlCondition: getDataUrlCondition(config, 'image'),
        })
        .set('generator', {
          filename: join(distDir, filename),
        });
    });
  },
});
