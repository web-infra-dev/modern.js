import type { BuilderPlugin } from '../types';

export const PluginEntry = (): BuilderPlugin => {
  return {
    name: 'builder-plugin-entry',

    setup(api) {
      api.modifyRspackConfig(async rspackConfig => {
        const originEntry = rspackConfig.entry || {};

        const entryObj =
          Array.isArray(originEntry) || typeof originEntry === 'string'
            ? { main: originEntry }
            : originEntry;

        rspackConfig.entry = {
          ...entryObj,
          ...api.context.entry,
        };
      });
    },
  };
};
