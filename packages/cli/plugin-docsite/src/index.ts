import { Import } from '@modern-js/utils';
import type { CliPlugin } from '@modern-js/core';

const features: typeof import('./features') = Import.lazy(
  './features',
  require,
);

export default (): CliPlugin => ({
  name: '@modern-js/plugin-docsite',
  setup: api => ({
    commands({ program }: any) {
      const { appDirectory, internalDirectory } = api.useAppContext();
      const devCommand = program.commandsMap.get('dev');
      if (devCommand) {
        devCommand.command('docs').action(async () => {
          await features.buildDocs({
            appDirectory,
            internalDirectory,
            isDev: true,
          });
        });
      }
    },
    // module-tools menu mode
    moduleToolsMenu() {
      const { appDirectory, internalDirectory, port } = api.useAppContext();
      return {
        name: 'Docsite 调试',
        value: 'docsite',
        runTask: async () =>
          features.buildDocs({
            appDirectory,
            internalDirectory,
            isDev: true,
            port,
          }),
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
});
