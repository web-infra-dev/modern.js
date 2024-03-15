import { posix } from 'path';

import {
  RsbuildPlugin,
  NormalizedConfig,
  DistPathConfig,
} from '@rsbuild/shared';

const getDistPath = (
  outputConfig: NormalizedConfig['output'],
  type: keyof DistPathConfig,
): string => {
  const { distPath } = outputConfig;
  const ret = distPath[type];
  if (typeof ret !== 'string') {
    throw new Error(`unknown key ${type} in "output.distPath"`);
  }
  return ret;
};

export const builderPluginAdapterWorker = (): RsbuildPlugin => ({
  name: 'builder-plugin-adapter-worker',

  setup(api) {
    api.modifyBundlerChain(async (chain, { isServiceWorker }) => {
      const config = api.getNormalizedConfig();

      if (isServiceWorker) {
        const workerPath = getDistPath(config.output, 'worker');
        const filename = posix.join(workerPath, `[name].js`);

        chain.output
          .filename(filename)
          .chunkFilename(filename)
          .libraryTarget('commonjs2');
      }
    });
  },
});
