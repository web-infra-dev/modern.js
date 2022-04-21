import { SpeedyPlugin } from '@speedy-js/speedy-types';

export const watchChangePlugin = (cb: ()=> void): SpeedyPlugin => {
  return {
    name: 'watchChange',
    apply(compiler) {
      compiler.hooks.watchChange.tap('watchChange', () => {
        cb();
      });
    },
  };
};
