import type { BuilderPlugin } from '../types';

export const PluginEntry = (): BuilderPlugin => {
  return {
    name: 'builder-plugin-entry',

    setup(api) {
      api.modifyRspackConfig(async rspackConfig => {
        const originEntry = rspackConfig.entry || {};
        const { entry } = api.context;
        const { preEntry } = api.getNormalizedConfig().source;

        // If a string or array of strings is passed, the chunk is named main.
        const entryObj =
          Array.isArray(originEntry) || typeof originEntry === 'string'
            ? { main: originEntry }
            : originEntry;

        if (preEntry.length) {
          rspackConfig.entry = Object.fromEntries(
            Object.entries({
              ...entryObj,
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
          ...entryObj,
          ...entry,
        };
      });
    },
  };
};
