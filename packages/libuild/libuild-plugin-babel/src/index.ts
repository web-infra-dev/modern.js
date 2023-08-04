import type { LibuildPlugin } from '@modern-js/libuild';
import type { TransformOptions as BabelTransformOptions } from '@babel/core';
import { isJsExt, resolvePathAndQuery, isJsLoader } from '@modern-js/libuild-utils';

export const babelPlugin = (options: BabelTransformOptions): LibuildPlugin => {
  return {
    name: 'libuild:babel',
    apply(compiler) {
      if (options) {
        compiler.hooks.transform.tapPromise('babel', async (args) => {
          const { originalFilePath } = resolvePathAndQuery(args.path);
          if (isJsExt(originalFilePath) || isJsLoader(args.loader)) {
            const result = await require('@babel/core').transformAsync(args.code, {
              filename: originalFilePath,
              sourceFileName: originalFilePath,
              sourceMaps: Boolean(compiler.config.sourceMap),
              sourceType: 'unambiguous',
              inputSourceMap: false,
              babelrc: false,
              configFile: false,
              compact: false,
              exclude: [/\bcore-js\b/],
              ...options,
            });
            return {
              ...args,
              code: result?.code,
              map: result?.map,
            };
          }
          return args;
        });
      }
    },
  };
};
