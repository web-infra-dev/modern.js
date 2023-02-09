import { join } from 'path';
import {
  getRegExpForExts,
  FONT_EXTENSIONS,
  getDistPath,
  getFilename,
  chainStaticAssetRule,
} from '@modern-js/builder-shared';
import type { DefaultBuilderPlugin } from '@modern-js/builder-shared';

export const builderPluginFont = (): DefaultBuilderPlugin => ({
  name: 'builder-plugin-font',

  setup(api) {
    api.modifyBundlerChain((chain, { isProd, CHAIN_ID }) => {
      const config = api.getNormalizedConfig();
      const regExp = getRegExpForExts(FONT_EXTENSIONS);
      const distDir = getDistPath(config.output, 'font');
      const filename = getFilename(config.output, 'font', isProd);

      const maxSize = config.output.dataUriLimit.image;

      const rule = chain.module.rule(CHAIN_ID.RULE.FONT).test(regExp);

      chainStaticAssetRule({
        rule,
        maxSize,
        filename: join(distDir, filename),
        assetType: 'font',
      });
    });
  },
});
