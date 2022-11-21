import { join } from 'path';
import {
  getRegExpForExts,
  IMAGE_EXTENSIONS,
  getDistPath,
} from '@modern-js/builder-shared';
import { getFilename, getDataUrlCondition } from '../shared';
import type { BuilderPlugin } from '../types';

export const PluginImage = (): BuilderPlugin => ({
  name: 'builder-plugin-image',

  setup(api) {
    api.modifyWebpackChain((chain, { isProd, CHAIN_ID }) => {
      const config = api.getNormalizedConfig();
      const regExp = getRegExpForExts(IMAGE_EXTENSIONS);
      const distDir = getDistPath(config.output, 'image');
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
