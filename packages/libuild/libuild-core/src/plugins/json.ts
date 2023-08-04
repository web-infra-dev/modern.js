import { readFileSync } from 'fs';
import { LibuildPlugin } from '../types';

const isJsonExt = (path: string) => {
  return path.endsWith('.json');
};

/**
 * only copy json file when bundle is false
 */
export const jsonPlugin = (): LibuildPlugin => {
  const pluginName = 'libuild:json';
  return {
    name: pluginName,
    apply(compiler) {
      compiler.hooks.load.tapPromise(pluginName, async (args) => {
        if (isJsonExt(args.path)) {
          return {
            contents: readFileSync(args.path),
            loader: 'copy',
          };
        }
      });
    },
  };
};
