import { join } from 'path';
import {
  getRegExpForExts,
  getDistPath,
  getFilename,
  chainStaticAssetRule,
  FilenameConfig,
} from '@modern-js/builder-shared';
import type { DefaultBuilderPlugin } from '@modern-js/builder-shared';

export const builderAssetPlugin = (
  assetType: keyof FilenameConfig,
  exts: string[],
): DefaultBuilderPlugin => ({
  name: `builder-plugin-${assetType}`,

  setup(api) {
    api.modifyBundlerChain((chain, { isProd }) => {
      const config = api.getNormalizedConfig();
      const regExp = getRegExpForExts(exts);
      const distDir = getDistPath(config.output, assetType);
      const filename = getFilename(config.output, assetType, isProd);

      const maxSize = config.output.dataUriLimit.image;

      const rule = chain.module.rule(assetType).test(regExp);

      chainStaticAssetRule({
        rule,
        maxSize,
        filename: join(distDir, filename),
        assetType,
      });
    });
  },
});
