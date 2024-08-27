import path from 'path';
import {
  type CliHooksRunner,
  type CliPlugin,
  type IAppContext,
  manager,
} from '@modern-js/core';
import { runtimePlugin } from '../../../../runtime/plugin-runtime/src/cli';
import { appTools } from '../../src/index';
import { getFileSystemEntry } from '../../src/plugins/analyze/getFileSystemEntry';
import type { AppNormalizedConfig, AppTools } from '../../src/types';

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

  test('should have one entry include src/App', async () => {
    const appContext = {
      appDirectory: path.resolve(fixtures, './single-entry'),
    };

    expect(
      await getFileSystemEntry(
        await getRunner(),
        appContext as IAppContext,
        config as AppNormalizedConfig<'shared'>,
      ),
    ).toMatchObject([
      {
        entryName: 'src',
        entry: path.resolve(fixtures, './single-entry/src/App.tsx'),
        isAutoMount: true,
        customBootstrap: false,
      },
    ]);
  });

  test(`should have one index entry with isAutoMount false`, async () => {
    const appContext = {
      appDirectory: path.resolve(fixtures, './index-entry'),
    };

    expect(
      await getFileSystemEntry(
        await getRunner(),
        appContext as IAppContext,
        config as AppNormalizedConfig<'shared'>,
      ),
    ).toMatchObject([
      {
        entryName: 'src',
        entry: path.resolve(appContext.appDirectory, './src/index.jsx'),
        isAutoMount: false,
      },
    ]);
  });

  test(`should have one entry with custom bootstrap function`, async () => {
    const appContext = {
      appDirectory: path.resolve(fixtures, './custom-bootstrap'),
    };

    expect(
      await getFileSystemEntry(
        await getRunner(),
        appContext as IAppContext,
        config as AppNormalizedConfig<'shared'>,
      ),
    ).toMatchObject([
      {
        entryName: 'src',
        entry: path.resolve(appContext.appDirectory, './src/App.tsx'),
        isAutoMount: true,
        customBootstrap: path.resolve(
          appContext.appDirectory,
          './src/index.tsx',
        ),
      },
    ]);
  });

  test(`should have no entry`, async () => {
    const appContext = { appDirectory: path.resolve(fixtures, './no-entry') };

    expect(
      (
        await getFileSystemEntry(
          await getRunner(),
          appContext as IAppContext,
          config as AppNormalizedConfig<'shared'>,
        )
      ).length,
    ).toBe(0);
  });
});
