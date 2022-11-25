import type { CliPlugin, ModuleToolsHooks } from '../../utils';

export default (): CliPlugin<ModuleToolsHooks> => {
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
