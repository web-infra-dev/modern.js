import type { BuilderPlugin } from '../types';

export const PluginEntry = (): BuilderPlugin => {
  return {
    name: 'builder-plugin-entry',

    setup(api) {
      api.modifyRspackConfig(async rspackConfig => {
        const originEntry = rspackConfig.entry || {};
        const { entry } = api.context;
        const { preEntry } = api.getNormalizedConfig().source;

        if (preEntry.length) {
          rspackConfig.entry = Object.fromEntries(
            Object.entries({
              ...originEntry,
              ...entry,
            }).map(([key, entry]) => {
              return [
                key,
                Array.isArray(entry)
                  ? [...preEntry, ...entry]
                  : [...preEntry, entry],
              ];
            }),
          );
          return;
        }

        rspackConfig.entry = {
          ...originEntry,
          ...entry,
        };
      });
    },
  };
};
