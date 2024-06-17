import path from 'path';
import {
  IAppContext,
  manager,
  CliPlugin,
  CliHooksRunner,
} from '@modern-js/core';
import appTools, { AppNormalizedConfig, AppTools } from '@modern-js/app-tools';
import { runtimePlugin } from '../../../../runtime/plugin-runtime/src/cli';
import { getFileSystemEntry } from '../../../../solutions/app-tools/src/plugins/analyze/getFileSystemEntry';
import { modifyEntrypoints } from '../../src/router/cli/entry';

async function getRunner() {
  const main = manager
    .clone()
    .usePlugin(appTools as CliPlugin, runtimePlugin as CliPlugin);

  const runner: CliHooksRunner<AppTools<'shared'>> = (await main.init()) as any;
  return runner;
}

describe('get entrypoints from file system', () => {
  const fixtures = path.resolve(__dirname, './fixtures/entries');

  const config = { source: { entriesDir: './src' } };

  test(`should have one entry include src/pages`, async () => {
    const appContext = {
      appDirectory: path.resolve(fixtures, './file-system-routes'),
    };

    const runner = await getRunner();
    const entrypoints = await getFileSystemEntry(
      runner,
      appContext as IAppContext,
      config as AppNormalizedConfig<'shared'>,
    );
    const newEntrypoints = modifyEntrypoints(entrypoints);
    expect(newEntrypoints).toMatchObject([
      {
        entryName: 'src',
        entry: path.resolve(fixtures, './file-system-routes/src/pages'),
        isAutoMount: true,
        customBootstrap: false,
        fileSystemRoutes: {
          globalApp: path.resolve(
            fixtures,
            './file-system-routes/src/pages/_app.ts',
          ),
        },
      },
    ]);
  });
});
