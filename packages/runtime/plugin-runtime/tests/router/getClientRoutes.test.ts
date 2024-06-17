import path from 'path';
import {
  CliHooksRunner,
  CliPlugin,
  manager,
  type IAppContext,
} from '@modern-js/core';
import { AppNormalizedConfig, AppTools, appTools } from '@modern-js/app-tools';
import {
  getClientRoutes,
  getClientRoutesLegacy,
} from '../../src/router/cli/code/getClientRoutes';
import { getBundleEntry } from '../../../../solutions/app-tools/src/plugins/analyze/getBundleEntry';
import { runtimePlugin } from '../../src/cli';
import { modifyEntrypoints } from '../../src/router/cli/entry';

type GetClientRoutesFunc =
  | typeof getClientRoutesLegacy
  | typeof getClientRoutes;

const prepareEnv = (fixturePath: string) => {
  const appContext = {
    appDirectory: fixturePath,
    srcDirectory: path.join(fixturePath, 'src'),
    internalDirectory: path.resolve(fixturePath, './node_modules/.modern-js'),
    internalDirAlias: '@_modern_js_internal',
    internalSrcAlias: '@_modern_js_src',
  };

  const config = { source: { entriesDir: './src' } };

  return {
    appContext,
    config,
  };
};

async function getRunner() {
  const main = manager
    .clone()
    .usePlugin(appTools as CliPlugin, runtimePlugin as CliPlugin);

  const runner: CliHooksRunner<AppTools<'shared'>> = (await main.init()) as any;
  return runner;
}

describe('getClientRoutesLegacy', () => {
  test('basic usage', async () =>
    basicUsage(getClientRoutesLegacy, await getRunner()));

  test('nested routes with `_app.tsx` and `_layout.tsx`', async () =>
    supportLayout(getClientRoutesLegacy, await getRunner()));
});

describe('getClientRoutes', () => {
  test('basic usage', async () =>
    basicUsage(getClientRoutes, await getRunner()));

  test('nested routes with `_app.tsx` and `_layout.tsx`', async () =>
    supportLayout(getClientRoutes, await getRunner()));
});

async function basicUsage(
  getClientRoutes: GetClientRoutesFunc,
  runner: CliHooksRunner<AppTools<'shared'>>,
) {
  const fixturePath = path.resolve(
    __dirname,
    './fixtures/entries/file-system-routes',
  );

  const { appContext, config } = prepareEnv(fixturePath);

  const entrypoints = await getBundleEntry(
    runner,
    appContext as IAppContext,
    config as AppNormalizedConfig<'shared'>,
  );
  const newEntrypoints = modifyEntrypoints(entrypoints);

  let routes;

  for (const entrypoint of newEntrypoints) {
    routes = getClientRoutes({
      entrypoint,
      srcDirectory: appContext.srcDirectory,
      srcAlias: appContext.internalSrcAlias,
      internalDirectory: appContext.internalDirectory,
      internalDirAlias: appContext.internalDirAlias,
    });
  }

  expect(routes).toMatchSnapshot();
}

async function supportLayout(
  getClientRoutes: GetClientRoutesFunc,
  runner: CliHooksRunner<AppTools<'shared'>>,
) {
  const fixturePath = path.resolve(
    __dirname,
    './fixtures/entries/file-system-routes-nested',
  );

  const { appContext, config } = prepareEnv(fixturePath);

  const entrypoints = await getBundleEntry(
    runner,
    appContext as IAppContext,
    config as AppNormalizedConfig<'shared'>,
  );
  const newEntrypoints = modifyEntrypoints(entrypoints);

  let routes;

  for (const entrypoint of newEntrypoints) {
    routes = getClientRoutes({
      entrypoint,
      srcDirectory: appContext.srcDirectory,
      srcAlias: appContext.internalSrcAlias,
      internalDirectory: appContext.internalDirectory,
      internalDirAlias: appContext.internalDirAlias,
    });
  }

  expect(routes).toMatchSnapshot();
}
