import { posix } from 'path';

import type {
  RsbuildPlugin,
  NormalizedConfig,
  DistPathConfig,
} from '@rsbuild/core';

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
    api.modifyBundlerChain(async (chain, { environment }) => {
      const { config, name } = environment;
      const isServiceWorker = name === 'serviceWorker';

      if (isServiceWorker) {
        const workerPath = getDistPath(config.output, 'root');
        const filename = posix.join(workerPath, `[name].js`);

        chain.output
          .filename(filename)
          .chunkFilename(filename)
          .libraryTarget('commonjs2');
      }
    });
  },
});
