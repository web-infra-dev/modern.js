import { join } from 'path';
import {
  getRegExpForExts,
  IMAGE_EXTENSIONS,
  getDistPath,
  getFilename,
  setConfig,
} from '@modern-js/builder-shared';
import type { BuilderPlugin } from '../types';

export const PluginImage = (): BuilderPlugin => ({
  name: 'builder-plugin-image',

  setup(api) {
    api.modifyRspackConfig((rspackConfig, { isProd }) => {
      const config = api.getNormalizedConfig();
      const regExp = getRegExpForExts(IMAGE_EXTENSIONS);
      const distDir = getDistPath(config.output, 'image');
      const filename = getFilename(config.output, 'image', isProd);

      // should use the last matching type if it is matched with multiple module type
      setConfig(rspackConfig, 'module.rules', [
        ...(rspackConfig.module?.rules || []),
        {
          // default: when size < dataUrlCondition.maxSize will inline
          type: 'asset',
          test: regExp,
          generator: {
            filename: join(distDir, filename),
          },
          parser: {
            dataUrlCondition: {
              maxSize: config.output.dataUriLimit.image,
            },
          },
        },
        {
          // forceInline: "foo.png?inline" or "foo.png?__inline",
          type: 'asset/inline',
          test: regExp,
          resourceQuery: /inline/,
        },
        {
          // forceNoInline: "foo.png?__inline=false" or "foo.png?url",
          type: 'asset',
          test: regExp,
          resourceQuery: /(__inline=false|url)/,
          generator: {
            filename: join(distDir, filename),
          },
        },
      ]);
    });
  },
});
