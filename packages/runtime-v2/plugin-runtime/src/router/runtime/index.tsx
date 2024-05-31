import { Plugin } from '../../runtime/plugin';

export const routerPlugin = (): Plugin => {
  return {
    name: '@modern-js/plugin-router',
    setup: _api => {
      let a = 1;
      return {
        async init({ context }, next) {
          console.log('init', a);
          a = 2;
          return next({ context });
        },
        hoc({ App }: { App: React.ComponentType }, next) {
          console.log('hoc', a);
          a = 3;
          return next({ App });
        },
      };
    },
  };
};
