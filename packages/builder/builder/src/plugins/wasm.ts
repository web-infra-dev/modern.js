import { join } from 'path';
import {
  getDistPath,
  type DefaultBuilderPlugin,
} from '@modern-js/builder-shared';

export const builderPluginWasm = (): DefaultBuilderPlugin => ({
  name: 'builder-plugin-wasm',

  setup(api) {
    api.modifyBundlerChain(async chain => {
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
