import path from 'path';
import { IAppContext, NormalizedConfig } from '@modern-js/core';
import { getFileSystemEntry } from '../src/getFileSystemEntry';

describe('get entrypoints from file system', () => {
  const fixtures = path.resolve(__dirname, './fixtures/entries');

  const config = { source: { entriesDir: './src' } };

  test('should have one entry include src/App', () => {
    const appContext = {
      appDirectory: path.resolve(fixtures, './single-entry'),
    };

    expect(
      getFileSystemEntry(appContext as IAppContext, config as NormalizedConfig),
    ).toMatchObject([
      {
        entryName: 'src',
        entry: path.resolve(fixtures, './single-entry/src/App'),
        isAutoMount: true,
        customBootstrap: false,
      },
    ]);
  });

  test(`should have one  entry include src/pages`, () => {
    const appContext = {
      appDirectory: path.resolve(fixtures, './file-system-routes'),
    };

    expect(
      getFileSystemEntry(appContext as IAppContext, config as NormalizedConfig),
    ).toMatchObject([
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

  test(`should have one index entry with isAutoMount false`, () => {
    const appContext = {
      appDirectory: path.resolve(fixtures, './index-entry'),
    };

    expect(
      getFileSystemEntry(appContext as IAppContext, config as NormalizedConfig),
    ).toMatchObject([
      {
        entryName: 'src',
        entry: path.resolve(appContext.appDirectory, './src/index.jsx'),
        isAutoMount: false,
      },
    ]);
  });

  test(`should have one entry with custom bootstrap function`, () => {
    const appContext = {
      appDirectory: path.resolve(fixtures, './custom-bootstrap'),
    };

    expect(
      getFileSystemEntry(appContext as IAppContext, config as NormalizedConfig),
    ).toMatchObject([
      {
        entryName: 'src',
        entry: path.resolve(appContext.appDirectory, './src/App'),
        isAutoMount: true,
        customBootstrap: path.resolve(
          appContext.appDirectory,
          './src/index.tsx',
        ),
      },
    ]);
  });

  test(`should have no entry`, () => {
    const appContext = { appDirectory: path.resolve(fixtures, './no-entry') };

    expect(
      getFileSystemEntry(appContext as IAppContext, config as NormalizedConfig)
        .length,
    ).toBe(0);
  });
});
