import { join } from 'path';
import { getRegExpForExts, IMAGE_EXTENSIONS } from '@modern-js/builder-shared';
import { getDistPath, getFilename, getDataUrlCondition } from '../shared';
import type { BuilderPlugin } from '../types';

export const PluginImage = (): BuilderPlugin => ({
  name: 'builder-plugin-image',

  setup(api) {
    api.modifyRspackConfig((rspackConfig, { isProd, CHAIN_ID }) => {
      // const config = api.getBuilderConfig();
      // const regExp = getRegExpForExts(IMAGE_EXTENSIONS);
      // const distDir = getDistPath(config, 'image');
      // const filename = getFilename(config, 'image', isProd);

    });
  },
});
