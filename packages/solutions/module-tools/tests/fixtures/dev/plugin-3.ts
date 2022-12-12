import type { CliPlugin, ModuleToolsHooks } from '../../utils';

export default (): CliPlugin<ModuleToolsHooks> => {
  return {
    name: 'dev-plugin-2',
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
