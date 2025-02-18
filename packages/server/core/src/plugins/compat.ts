import type { ServerPluginFurure } from '../types';

export const compatPlugin = (): ServerPluginFurure => ({
  name: '@modern-js/server-compat',
  registryHooks: {},
  _registryApi: (getServerContext, updateServerContext) => {
    return {};
  },
  setup: () => {},
});
