import path from 'path';
import { createRuntimeExportsUtils, PLUGIN_SCHEMAS } from '@modern-js/utils';
import type { CliPlugin } from '@modern-js/core';
import test from './test';

export default (): CliPlugin => ({
  name: '@modern-js/plugin-testing',
  setup: api => {
    let testingExportsUtils: ReturnType<typeof createRuntimeExportsUtils>;
    const { useAppContext } = api;
    return {
      commands: ({ program }: any) => {
        program
          .command('test')
          .allowUnknownOption()
          .usage('[options]')
          .action(async () => {
            await test();
          });
      },
      validateSchema() {
        return PLUGIN_SCHEMAS['@modern-js/plugin-testing'];
      },
      config() {
        // eslint-disable-next-line react-hooks/rules-of-hooks
        const appContext = useAppContext();

        testingExportsUtils = createRuntimeExportsUtils(
          appContext.internalDirectory,
          'testing',
        );

        return {
          source: {
            alias: {
              '@modern-js/runtime/testing': testingExportsUtils.getPath(),
            },
          },
        };
      },
      addRuntimeExports() {
        const testingPath = path.resolve(__dirname, '../');

        testingExportsUtils.addExport(`export * from '${testingPath}'`);
      },
    };
  },
});
