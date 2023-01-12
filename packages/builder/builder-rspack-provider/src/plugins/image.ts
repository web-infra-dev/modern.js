import { join } from 'path';
import {
  getRegExpForExts,
  IMAGE_EXTENSIONS,
  getDistPath,
  getFilename,
} from '@modern-js/builder-shared';
import type { BuilderPlugin } from '../types';

export const PluginImage = (): BuilderPlugin => ({
  name: 'builder-plugin-image',

  setup(api) {
    api.modifyBundlerChain((chain, { isProd }) => {
      const config = api.getNormalizedConfig();
      const regExp = getRegExpForExts(IMAGE_EXTENSIONS);
      const distDir = getDistPath(config.output, 'image');
      const filename = getFilename(config.output, 'image', isProd);

      // todo: not support oneOf yet. should use oneOf and CHAIN_ID.RULE.SVG refactor
      // should use the last matching type if it is matched with multiple module type
      // default: when size < dataUrlCondition.maxSize will inline
      chain.module
        .rule('svg-default')
        .test(regExp)
        .type('asset')
        .parser({
          dataUrlCondition: {
            maxSize: config.output.dataUriLimit.image,
          },
        })
        .set('generator', {
          filename: join(distDir, filename),
        })
        .end();

      // forceInline: "foo.png?inline" or "foo.png?__inline",
      chain.module
        .rule('svg-inline')
        .test(regExp)
        .type('asset/inline')
        .resourceQuery(/inline/)
        .end();

      // forceNoInline: "foo.png?__inline=false" or "foo.png?url",
      chain.module
        .rule('svg-url')
        .test(regExp)
        .type('asset')
        .resourceQuery(/(__inline=false|url)/)
        .set('generator', {
          filename: join(distDir, filename),
        })
        .parser({
          dataUrlCondition: {
            maxSize: 0,
          },
        })
        .end();
    });
  },
});
