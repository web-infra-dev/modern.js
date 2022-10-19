import { join } from 'path';
import { getRegExpForExts, MEDIA_EXTENSIONS } from '@modern-js/builder-shared';
import { getDistPath, getFilename, getDataUrlCondition } from '../shared';
import type { BuilderPlugin } from '../types';

export const PluginMedia = (): BuilderPlugin => ({
  name: 'builder-plugin-media',

  setup(api) {
    api.modifyWebpackChain((chain, { isProd, CHAIN_ID }) => {
      const config = api.getNormalizedConfig();
      const regExp = getRegExpForExts(MEDIA_EXTENSIONS);

      const distDir = getDistPath(config, 'media');
      const filename = getFilename(config, 'media', isProd);

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
