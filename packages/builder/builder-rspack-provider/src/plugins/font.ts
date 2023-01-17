import { join } from 'path';
import {
  getRegExpForExts,
  FONT_EXTENSIONS,
  getDistPath,
  getFilename,
} from '@modern-js/builder-shared';
import { chainStaticAssetRule } from '../shared';
import type { BuilderPlugin } from '../types';

export const builderPluginFont = (): BuilderPlugin => ({
  name: 'builder-plugin-font',

  setup(api) {
    api.modifyBundlerChain((chain, { isProd }) => {
      const config = api.getNormalizedConfig();
      const regExp = getRegExpForExts(FONT_EXTENSIONS);
      const distDir = getDistPath(config.output, 'font');
      const filename = getFilename(config.output, 'font', isProd);

      const maxSize = config.output.dataUriLimit.image;

      chainStaticAssetRule({
        chain,
        regExp,
        maxSize,
        filename: join(distDir, filename),
        assetType: 'font',
      });
    });
  },
});
