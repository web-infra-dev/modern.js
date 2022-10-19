import type { BuilderPlugin } from '../types';
import _ from '@modern-js/utils/lodash';

export const PluginEntry = (): BuilderPlugin => ({
  name: 'builder-plugin-entry',

  setup(api) {
    api.modifyWebpackChain(async chain => {
      const { entry } = api.context;
      const { preEntry } = api.getNormalizedConfig().source;

      Object.keys(entry).forEach(entryName => {
        const appendEntry = (file: string) => chain.entry(entryName).add(file);
        preEntry.forEach(appendEntry);
        _.castArray(entry[entryName]).forEach(appendEntry);
      });
    });
  },
});
