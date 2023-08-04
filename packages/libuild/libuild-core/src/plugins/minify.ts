import { isObject, deepMerge } from '@modern-js/libuild-utils';
import { minify as terserMinify, MinifyOptions as TerserMinifyOptions } from 'terser';
import { ChunkType, LibuildPlugin, CLIConfig } from '../types';
import { normalizeSourceMap } from '../utils';

export const minifyPlugin = (): LibuildPlugin => {
  const pluginName = 'libuild:minify';
  return {
    name: pluginName,
    apply(compiler) {
      compiler.hooks.processAsset.tapPromise(pluginName, async (chunk) => {
        const { sourceMap, minify, target } = compiler.config;
        if (chunk.type === ChunkType.chunk && minify !== 'esbuild') {
          const code = chunk.contents.toString();
          const needSourceMap = Boolean(sourceMap);
          if (minify) {
            const terserOptions = resolveTerserOptions(minify, {
              sourceMap: Boolean(needSourceMap),
              target,
            });
            const result = await terserMinify(code, {
              ...terserOptions,
              sourceMap: needSourceMap,
            });
            return {
              ...chunk,
              contents: result.code || chunk.contents,
              map: normalizeSourceMap(result.map as any, { needSourceMap }),
            };
          }
        }
        return chunk;
      });
    },
  };
};

function resolveTerserOptions(
  terserOptions: TerserMinifyOptions | 'terser',
  { sourceMap, target }: { sourceMap: boolean; target: CLIConfig['target'] }
): TerserMinifyOptions {
  // cra: https://github.com/facebook/create-react-app/blob/main/packages/react-scripts/config/webpack.config.js#L237
  return deepMerge(
    {
      compress: {
        ecma: target === 'es5' ? 5 : 2020,
        inline: 2,
        comparisons: false,
      },
      format: { keep_quoted_props: true, comments: false },
      // Return object to avoid redundant `JSON.parse` in remapping
      sourceMap: sourceMap
        ? {
            asObject: true,
            // `includeSources` is not necessary for minification,
            // and we can utilize this to reduce the size of the source map.
            includeSources: false,
          }
        : false,
      safari10: true,
      toplevel: true,
    },
    isObject(terserOptions) ? terserOptions : {}
  );
}
