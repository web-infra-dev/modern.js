import { transform } from 'sucrase';
import { LibuildPlugin } from '../types';

export const formatCjsPlugin = (): LibuildPlugin => {
  const pluginName = 'libuild:format-cjs';
  return {
    name: pluginName,
    apply(compiler) {
      compiler.hooks.processAsset.tapPromise({ name: pluginName }, async (chunk) => {
        if (chunk.fileName.endsWith('.js') && chunk.type === 'chunk') {
          const code = chunk.contents.toString();
          const result = transform(code, {
            transforms: ['imports'],
          });
          return {
            ...chunk,
            contents: result.code,
            map: result.sourceMap,
          };
        }
        return chunk;
      });
    },
  };
};
