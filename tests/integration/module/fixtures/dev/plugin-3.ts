import type { CliPlugin, ModuleTools } from '../../utils';

export const devPlugin3 = (): CliPlugin<ModuleTools> => {
  return {
    name: 'dev-plugin-3',
    setup: () => {
      return {
        registerDev() {
          return {
            name: 'plugin-3',
            menuItem: {
              name: 'dev-3',
              value: 'dev-3',
            },
            action() {
              console.info('running dev-3');
            },
          };
        },
        beforeDevMenu(orginQuestion) {
          return orginQuestion;
        },
      };
    },
  };
};
