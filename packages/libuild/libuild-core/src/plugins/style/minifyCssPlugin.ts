import { isObject } from '@modern-js/libuild-utils';
import CleanCss from 'clean-css';
import { LibuildPlugin } from '../../types';

export const minifyCssPlugin = (): LibuildPlugin => {
  const pluginName = 'libuild:cssMinify';
  return {
    name: pluginName,
    apply(compiler) {
      compiler.hooks.processAsset.tap(pluginName, (chunk) => {
        const cleanCss = compiler.config.style.cleanCss ?? false;
        if (!cleanCss) return chunk;
        if (chunk.fileName.endsWith('.css')) {
          const minifyCssOptions: CleanCss.OptionsOutput = isObject(cleanCss) ? cleanCss : { level: 2 };
          const minifyContent = new CleanCss(minifyCssOptions).minify(chunk.contents).styles;
          return {
            ...chunk,
            contents: minifyContent,
          };
        }
        return chunk;
      });
    },
  };
};
