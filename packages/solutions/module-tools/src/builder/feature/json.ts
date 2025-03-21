import { readFileSync } from 'fs';
import type { ICompiler, LoadResult } from '../../types';

const isJsonExt = (path: string) => {
  return path.endsWith('.json');
};

const name = 'json';
export const json = {
  name,
  apply(compiler: ICompiler) {
    compiler.hooks.load.tapPromise({ name }, async args => {
      if (isJsonExt(args.path)) {
        return {
          contents: readFileSync(
            args.path,
          ) as unknown as LoadResult['contents'],
          loader: 'copy',
        };
      }
    });
  },
};
