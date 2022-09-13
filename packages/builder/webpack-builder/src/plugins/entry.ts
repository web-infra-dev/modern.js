import type { EntryObject } from 'webpack';
import type { BuilderPlugin } from '../types';

export const PluginEntry = (): BuilderPlugin => ({
  name: 'webpack-builder-plugin-entry',

  setup(api) {
    api.modifyWebpackChain(async chain => {
      const { ensureArray } = await import('@modern-js/utils');

      const { entry } = api.context;
      const config = api.getBuilderConfig();

      const { preEntry, vendorEntry = {} } = config.source || {};
      const preEntries = preEntry ? ensureArray(preEntry) : [];

      const addEntries = (entryObject: EntryObject) => {
        Object.keys(entryObject).forEach(entryName => {
          preEntries.forEach(entry => {
            chain.entry(entryName).add(entry);
          });

          ensureArray(entryObject[entryName]).forEach(item => {
            chain.entry(entryName).add(item as string);
          });
        });
      };
      addEntries(entry);
      addEntries(vendorEntry);
    });
  },
});
