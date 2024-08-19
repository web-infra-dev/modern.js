import { transform } from 'sucrase';
import type { ICompiler } from '../../types';

const name = 'format-cjs';
const apply = (compiler: ICompiler) => {
  compiler.hooks.renderChunk.tapPromise({ name }, async chunk => {
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
};

export const formatCjs = {
  name,
  apply,
};
