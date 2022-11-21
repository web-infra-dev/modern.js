import type { CliPlugin, ModuleToolsHooks } from '../../utils';

export const meta = {
  name: 'plugin-1',
  subCommands: ['plugin-1'],
  menuItem: {
    name: 'dev-1',
    value: 'dev-1',
  },
  action: () => {
    console.info('running dev-1');
  },
};

export default (): CliPlugin<ModuleToolsHooks> => {
  return {
    name: 'dev-plugin-1',
    setup: () => {
      return {
        registerDev() {
          return meta;
        },
      };
    },
  };
};
