import { Plugin } from '@modern-js/runtime-v2';

export * from './utils';
export * from './provider';

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface GarfishConfig {}

export const garfishPlugin = (_config: GarfishConfig): Plugin => {
  return {
    name: '@modern-js/plugin-garfish',
    setup: () => {
      return {
        hoc({ App, config }, next) {
          return next({
            App,
            config,
          });
        },
      };
    },
  };
};

export default garfishPlugin;
