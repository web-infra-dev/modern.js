import { readFileSync } from 'fs';
import { ICompiler } from '../../types';

const isJsonExt = (path: string) => {
  return path.endsWith('.json');
};

const name = 'json';
export const json = {
  name,
  hooks(compiler: ICompiler) {
    compiler.hooks.load.tapPromise({ name }, async args => {
      if (isJsonExt(args.path)) {
        return {
          contents: readFileSync(args.path),
          loader: 'copy',
        };
      }
    });
  },
};
