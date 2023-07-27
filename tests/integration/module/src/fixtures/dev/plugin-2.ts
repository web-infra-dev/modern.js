import type { CliPlugin, ModuleTools } from '../../utils';

export const devPlugin2 = (): CliPlugin<ModuleTools> => {
  return {
    name: 'dev-plugin-2',
    setup: () => {
      return {
        registerDev() {
          return {
            name: 'plugin-2',
            menuItem: {
              name: 'dev-2',
              value: 'dev-2',
            },
            action() {
              console.info('running dev-2');
            },
          };
        },
      };
    },
  };
};
