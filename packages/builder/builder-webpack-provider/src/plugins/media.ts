import { join } from 'path';
import {
  getRegExpForExts,
  MEDIA_EXTENSIONS,
  getDistPath,
  getFilename,
} from '@modern-js/builder-shared';
import { getDataUrlCondition } from '../shared';
import type { BuilderPlugin } from '../types';

export const PluginMedia = (): BuilderPlugin => ({
  name: 'builder-plugin-media',

  setup(api) {
    api.modifyWebpackChain((chain, { isProd, CHAIN_ID }) => {
      const config = api.getNormalizedConfig();
      const regExp = getRegExpForExts(MEDIA_EXTENSIONS);

      const distDir = getDistPath(config.output, 'media');
      const filename = getFilename(config.output, 'media', isProd);

      chain.module
        .rule(CHAIN_ID.RULE.MEDIA)
        .test(regExp)
        .type('asset')
        .parser({
          dataUrlCondition: getDataUrlCondition(config, 'media'),
        })
        .set('generator', {
          filename: join(distDir, filename),
        });
    });
  },
});
