import type { BuilderPlugin } from '../types';

export const PluginEntry = (): BuilderPlugin => {
  return {
    name: 'builder-plugin-entry',

    setup(api) {
      api.modifyRspackConfig(async rspackConfig => {
        const originEntry = rspackConfig.entry || {};
        const { entry } = api.context;
        const { preEntry } = api.getNormalizedConfig().source;

        const entryObj =
          Array.isArray(originEntry) || typeof originEntry === 'string'
            ? { main: originEntry }
            : originEntry;

        if (preEntry.length) {
          // eslint-disable-next-line node/no-unsupported-features/es-builtins
          rspackConfig.entry = Object.fromEntries(
            Object.entries({
              ...entryObj,
              ...entry,
            }).map(([key, entry]) => {
              return [
                key,
                Array.isArray(entry)
                  ? [...entry, ...preEntry]
                  : [entry, ...preEntry],
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
