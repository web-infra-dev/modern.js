import { Import } from '@modern-js/utils';
import type { CliPlugin } from '@modern-js/core';

const features: typeof import('./features') = Import.lazy(
  './features',
  require,
);

export default (): CliPlugin => ({
  name: '@modern-js/plugin-docsite',
  setup: api => ({
    commands({ program }) {
      const appContext = api.useAppContext();
      const modernConfig = api.useResolvedConfigContext();
      const devCommand = program.commandsMap.get('dev');
      if (devCommand) {
        devCommand.command('docs').action(async () => {
          await features.buildDocs({
            appContext,
            modernConfig,
            isDev: true,
          });
        });
      }
    },
    // module-tools menu mode
    moduleToolsMenu() {
      const appContext = api.useAppContext();
      const modernConfig = api.useResolvedConfigContext();
      const { port } = appContext;
      return {
        name: 'Docsite 调试',
        value: 'docsite',
        runTask: async () =>
          features.buildDocs({
            appContext,
            modernConfig,
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
