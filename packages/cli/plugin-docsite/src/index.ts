import { Import } from '@modern-js/utils';

const core: typeof import('@modern-js/core') = Import.lazy(
  '@modern-js/core',
  require,
);
const features: typeof import('./features') = Import.lazy(
  './features',
  require,
);

export default core.createPlugin(
  () => ({
    commands({ program }: any) {
      const { appDirectory } = core.useAppContext();
      const devCommand = program.commandsMap.get('dev');
      if (devCommand) {
        devCommand.command('docs').action(async () => {
          await features.buildDocs({ appDirectory, isDev: true });
        });
      }
    },
    // module-tools menu mode
    moduleToolsMenu() {
      const { appDirectory } = core.useAppContext();
      return {
        name: 'Docsite 调试',
        value: 'docsite',
        runTask: async () => features.buildDocs({ appDirectory, isDev: true }),
      };
    },
    platformBuild() {
      return {
        name: 'docsite',
        title: 'Run Docsite log',
        taskPath: require.resolve('./build-task'),
        params: [],
      };
    },
  }),
  { name: '@modern-js/plugin-docsite' },
);
