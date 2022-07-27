import { isProd } from '../shared';
import type { WebBuilderPlugin } from '../types';

export const PluginMode = (): WebBuilderPlugin => ({
  name: 'web-builder-plugin-mode',

  setup(api) {
    api.modifyWebpackChain(chain => {
      const mode = isProd() ? 'production' : 'development';
      chain.mode(mode);
    });
  },
});
