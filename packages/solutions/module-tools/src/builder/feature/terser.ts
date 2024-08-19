import { isObject, lodash } from '@modern-js/utils';
import {
  minify as terserMinify,
  type MinifyOptions as TerserMinifyOptions,
} from 'terser';
import { ChunkType, type ICompiler } from '../../types';
import { normalizeSourceMap } from '../../utils';

const name = 'terser';
const apply = (compiler: ICompiler) => {
  compiler.hooks.renderChunk.tapPromise({ name }, async chunk => {
    const { sourceMap, minify } = compiler.config;
    if (chunk.type === ChunkType.chunk) {
      const code = chunk.contents.toString();
      const needSourceMap = Boolean(sourceMap);
      const terserOptions = resolveTerserOptions(
        minify as TerserMinifyOptions | 'terser',
        {
          sourceMap: Boolean(needSourceMap),
        },
      );
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
    return chunk;
  });
};

export const minify = {
  name,
  apply,
};

function resolveTerserOptions(
  terserOptions: TerserMinifyOptions | 'terser',
  { sourceMap }: { sourceMap: boolean },
): TerserMinifyOptions {
  // cra: https://github.com/facebook/create-react-app/blob/main/packages/react-scripts/config/webpack.config.js#L237
  return lodash.merge(
    {
      compress: {
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
    isObject(terserOptions) ? terserOptions : {},
  );
}
