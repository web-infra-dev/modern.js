import path from 'path';
import type { IAppContext, NormalizedConfig } from '@modern-js/core';
import { getBundleEntry } from '../../src/analyze/getBundleEntry';
import {
  getClientRoutes,
  getClientRoutesLegacy,
} from '../../src/analyze/getClientRoutes';

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

describe('getClientRoutesLegacy', () => {
  test('basic usage', () => basicUsage(getClientRoutesLegacy));

  test('nested routes with `_app.tsx` and `_layout.tsx`', () =>
    supportLayout(getClientRoutesLegacy));
});

describe('getClientRoutes', () => {
  test('basic usage', () => basicUsage(getClientRoutes));

  test('nested routes with `_app.tsx` and `_layout.tsx`', () =>
    supportLayout(getClientRoutes));
});

function basicUsage(getClientRoutes: GetClientRoutesFunc) {
  const fixturePath = path.resolve(
    __dirname,
    './fixtures/entries/file-system-routes',
  );

  const { appContext, config } = prepareEnv(fixturePath);

  const entries = getBundleEntry(
    appContext as IAppContext,
    config as NormalizedConfig,
  );

  let routes;

  for (const entrypoint of entries) {
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

function supportLayout(getClientRoutes: GetClientRoutesFunc) {
  const fixturePath = path.resolve(
    __dirname,
    './fixtures/entries/file-system-routes-nested',
  );

  const { appContext, config } = prepareEnv(fixturePath);

  const entries = getBundleEntry(
    appContext as IAppContext,
    config as NormalizedConfig,
  );

  let routes;

  for (const entrypoint of entries) {
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
