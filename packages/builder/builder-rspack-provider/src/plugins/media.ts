import { join } from 'path';
import {
  getRegExpForExts,
  MEDIA_EXTENSIONS,
  getDistPath,
  getFilename,
} from '@modern-js/builder-shared';
import { chainStaticAssetRule } from '../shared';
import type { BuilderPlugin } from '../types';

export const PluginMedia = (): BuilderPlugin => ({
  name: 'builder-plugin-media',

  setup(api) {
    api.modifyBundlerChain((chain, { isProd }) => {
      const config = api.getNormalizedConfig();
      const regExp = getRegExpForExts(MEDIA_EXTENSIONS);

      const distDir = getDistPath(config.output, 'media');
      const filename = getFilename(config.output, 'media', isProd);

      const maxSize = config.output.dataUriLimit.image;

      chainStaticAssetRule({
        chain,
        regExp,
        maxSize,
        filename: join(distDir, filename),
        assetType: 'media',
      });
    });
  },
});
