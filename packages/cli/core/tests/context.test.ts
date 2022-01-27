import path from 'path';
import { initAppContext } from '../src/context';

describe('context', () => {
  it('initAppContext', () => {
    const appDirectory = path.resolve(
      __dirname,
      './fixtures/load-plugin/user-plugins',
    );
    const appContext = initAppContext(appDirectory, [], false);
    expect(appContext).toEqual({
      appDirectory,
      configFile: false,
      ip: expect.any(String),
      port: 0,
      packageName: expect.any(String),
      srcDirectory: expect.any(String),
      distDirectory: expect.any(String),
      sharedDirectory: expect.any(String),
      nodeModulesDirectory: expect.any(String),
      internalDirectory: expect.any(String),
      plugins: [],
      htmlTemplates: {},
      serverRoutes: [],
      entrypoints: [],
    });
  });

  it('custom AppContext', () => {
    const appDirectory = path.resolve(
      __dirname,
      './fixtures/load-plugin/user-plugins',
    );

    const customOptions = {
      srcDir: 'source',
      distDir: 'dist',
      sharedDir: 'myShared',
      internalDir: 'myInternal',
    };

    const appContext = initAppContext(appDirectory, [], false, customOptions);
    expect(appContext).toEqual({
      appDirectory,
      configFile: false,
      ip: expect.any(String),
      port: 0,
      packageName: 'user-plugins',
      srcDirectory: path.resolve(appDirectory, './source'),
      distDirectory: 'dist',
      sharedDirectory: path.resolve(appDirectory, './myShared'),
      nodeModulesDirectory: expect.any(String),
      internalDirectory: path.resolve(appDirectory, './myInternal'),
      plugins: [],
      htmlTemplates: {},
      serverRoutes: [],
      entrypoints: [],
    });
  });
});
