import webpack from 'webpack';
import { expect, describe, it } from 'vitest';
import {
  stringifyConfig,
  MODULE_PATH_REGEX,
  getPackageNameFromModulePath,
} from '../../src/shared';
import type { BuilderConfig, WebpackConfig } from '../../src/types';

describe('getPackageNameFromModulePath', () => {
  it('should parse correct path fragment in npm/yarn', async () => {
    let modulePath = '/path/to/node_modules/@scope/package-name/index.js';
    let [, , scope, name] = modulePath.match(MODULE_PATH_REGEX)!;
    expect(scope).toBe('@scope');
    expect(name).toBe('package-name');

    modulePath = '/path/to/node_modules/package-name/index.js';
    [, , scope, name] = modulePath.match(MODULE_PATH_REGEX)!;
    expect(scope).toBe(undefined);
    expect(name).toBe('package-name');
  });

  it('should parse correct path fragment in pnpm', async () => {
    let modulePath = '/path/to/node_modules/.pnpm/@scope/package-name/index.js';
    let [, , scope, name] = modulePath.match(MODULE_PATH_REGEX)!;
    expect(scope).toBe('@scope');
    expect(name).toBe('package-name');

    modulePath = '/path/to/node_modules/.pnpm/package-name/index.js';
    [, , scope, name] = modulePath.match(MODULE_PATH_REGEX)!;
    expect(scope).toBe(undefined);
    expect(name).toBe('package-name');
  });

  it('should return correct package name in npm/yarn', () => {
    let modulePath = '/path/to/node_modules/@scope/package-name/index.js';
    expect(getPackageNameFromModulePath(modulePath)).toBe(
      'npm.scope.package-name',
    );

    modulePath = '/path/to/node_modules/package-name/index.js';
    expect(getPackageNameFromModulePath(modulePath)).toBe('npm.package-name');
  });

  it('should return correct package name in pnpm', () => {
    let modulePath = '/path/to/node_modules/.pnpm/@scope/package-name/index.js';
    expect(getPackageNameFromModulePath(modulePath)).toBe(
      'npm.scope.package-name',
    );

    modulePath = '/path/to/node_modules/.pnpm/package-name/index.js';
    expect(getPackageNameFromModulePath(modulePath)).toBe('npm.package-name');
  });
});

describe('stringifyConfig', () => {
  it('should stringify webpack config correctly', async () => {
    const { DefinePlugin } = webpack;
    const webpackConfig: WebpackConfig = {
      mode: 'development',
      plugins: [new DefinePlugin({ foo: 'bar' })],
    };

    expect(await stringifyConfig(webpackConfig)).toMatchSnapshot();
  });

  it('should stringify builder config correctly', async () => {
    const builderConfig: BuilderConfig = {
      tools: {
        webpackChain(chain) {
          chain.devtool('eval');
        },
      },
    };

    expect(await stringifyConfig(builderConfig)).toMatchSnapshot();
  });
});
