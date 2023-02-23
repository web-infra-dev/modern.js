import { join } from 'path';
import { getDistPath } from '@modern-js/builder-shared';
import type { BuilderPlugin } from '../types';

export const builderPluginWasm = (): BuilderPlugin => ({
  name: 'builder-plugin-wasm',

  setup(api) {
    api.modifyWebpackChain(async chain => {
      const config = api.getNormalizedConfig();
      const distPath = getDistPath(config.output, 'wasm');

      chain.experiments({
        ...chain.get('experiments'),
        asyncWebAssembly: true,
      });
      chain.output.merge({
        webassemblyModuleFilename: join(distPath, '[hash].module.wasm'),
      });
    });
  },
});
