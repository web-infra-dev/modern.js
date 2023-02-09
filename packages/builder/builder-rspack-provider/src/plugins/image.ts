import { join } from 'path';
import {
  getRegExpForExts,
  IMAGE_EXTENSIONS,
  getDistPath,
  getFilename,
} from '@modern-js/builder-shared';
import type { BuilderPlugin } from '../types';
import { chainStaticAssetRule } from '../shared';

export const builderPluginImage = (): BuilderPlugin => ({
  name: 'builder-plugin-image',

  setup(api) {
    api.modifyBundlerChain((chain, { isProd, CHAIN_ID }) => {
      const config = api.getNormalizedConfig();
      const regExp = getRegExpForExts(IMAGE_EXTENSIONS);
      const distDir = getDistPath(config.output, 'image');
      const filename = getFilename(config.output, 'image', isProd);
      const maxSize = config.output.dataUriLimit.image;
      const rule = chain.module.rule(CHAIN_ID.RULE.IMAGE).test(regExp);

      chainStaticAssetRule({
        rule,
        maxSize,
        filename: join(distDir, filename),
        assetType: 'image',
      });
    });
  },
});
