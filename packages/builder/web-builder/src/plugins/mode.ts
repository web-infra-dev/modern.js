import { isProd } from '../shared';
import type { BuilderPlugin } from '../types';

export const PluginMode = (): BuilderPlugin => ({
  name: 'web-builder-plugin-mode',

  setup(api) {
    api.modifyWebpackChain(chain => {
      const mode = isProd() ? 'production' : 'development';
      chain.mode(mode);
    });
  },
});
