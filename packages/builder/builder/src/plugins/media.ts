import { join } from 'path';
import {
  getRegExpForExts,
  MEDIA_EXTENSIONS,
  getDistPath,
  getFilename,
  chainStaticAssetRule,
} from '@modern-js/builder-shared';
import type { DefaultBuilderPlugin } from '@modern-js/builder-shared';

export const builderPluginMedia = (): DefaultBuilderPlugin => ({
  name: 'builder-plugin-media',

  setup(api) {
    api.modifyBundlerChain((chain, { isProd, CHAIN_ID }) => {
      const config = api.getNormalizedConfig();
      const regExp = getRegExpForExts(MEDIA_EXTENSIONS);

      const distDir = getDistPath(config.output, 'media');
      const filename = getFilename(config.output, 'media', isProd);

      const maxSize = config.output.dataUriLimit.image;

      const rule = chain.module.rule(CHAIN_ID.RULE.MEDIA).test(regExp);

      chainStaticAssetRule({
        rule,
        maxSize,
        filename: join(distDir, filename),
        assetType: 'media',
      });
    });
  },
});
