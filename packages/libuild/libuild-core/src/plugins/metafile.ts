import path from 'path';
import { LibuildPlugin } from '../types';

export const metaFilePlugin = (): LibuildPlugin => {
  const pluginName = 'libuild:metafile';
  return {
    name: pluginName,
    apply(compiler) {
      compiler.hooks.processAssets.tapPromise(pluginName, async (_chunk, manifest) => {
        const now = Date.now();
        compiler.emitAsset(
          path.resolve(compiler.config.outdir, `metafile-${now}.json`),
          JSON.stringify(manifest.metafile, null, 2)
        );
      });
    },
  };
};
