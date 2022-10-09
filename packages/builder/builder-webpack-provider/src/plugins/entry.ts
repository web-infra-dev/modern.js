import type { BuilderPlugin } from '../types';

export const PluginEntry = (): BuilderPlugin => ({
  name: 'builder-plugin-entry',

  setup(api) {
    api.modifyWebpackChain(async chain => {
      const { ensureArray } = await import('@modern-js/utils');

      const { entry } = api.context;
      const config = api.getBuilderConfig();

      const { preEntry } = config.source || {};
      const preEntries = preEntry ? ensureArray(preEntry) : [];

      Object.keys(entry).forEach(entryName => {
        preEntries.forEach(entry => {
          chain.entry(entryName).add(entry);
        });

        ensureArray(entry[entryName]).forEach(item => {
          chain.entry(entryName).add(item);
        });
      });
    });
  },
});
