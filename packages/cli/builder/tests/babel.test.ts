import { join } from 'path';
import { describe, expect, it } from '@rstest/core';
import { createBuilder } from '../src';
import { matchRules, unwrapConfig } from './helper';

describe('plugin-babel (rspack mode)', () => {
  it('should not set babel-loader when babel config not modified', async () => {
    const rsbuild = await createBuilder({
      cwd: join(__dirname, '..'),
      bundlerType: 'rspack',
      config: {
        output: {
          polyfill: 'entry',
        },
        performance: {
          buildCache: false,
        },
        tools: {
          babel: {},
        },
      },
    });

    const config = await unwrapConfig(rsbuild);

    expect(
      matchRules({
        config,
        testFile: 'a.js',
      }),
    ).toMatchSnapshot();
  });

  it('should set babel-loader when babel config modified', async () => {
    const rsbuild = await createBuilder({
      cwd: join(__dirname, '..'),
      bundlerType: 'rspack',
      config: {
        output: {
          polyfill: 'entry',
        },
        performance: {
          buildCache: false,
        },
        tools: {
          babel(config) {
            config.plugins ??= [];
            config.plugins.push([
              'babel-plugin-import',
              {
                libraryName: 'xxx-components',
                libraryDirectory: 'es',
                style: true,
              },
            ]);
          },
        },
      },
    });

    const config = await unwrapConfig(rsbuild);

    expect(
      matchRules({
        config,
        testFile: 'a.js',
      }),
    ).toMatchSnapshot();
  });

  it('should set babel-loader when environment babel config defined', async () => {
    const rsbuild = await createBuilder({
      cwd: join(__dirname, '..'),
      bundlerType: 'rspack',
      config: {
        output: {
          polyfill: 'entry',
        },
        performance: {
          buildCache: false,
        },
        environments: {
          web: {
            tools: {
              babel(config) {
                config.plugins ??= [];
                config.plugins.push([
                  'babel-plugin-import',
                  {
                    libraryName: 'components',
                    libraryDirectory: 'es',
                    style: true,
                  },
                ]);
              },
            },
          },
          web1: {},
        },
      },
    });

    const configs = await rsbuild.initConfigs();
    const webConfig = configs.find(config => config.name === 'web');
    const web1Config = configs.find(config => config.name === 'web1');

    expect(
      matchRules({
        config: webConfig!,
        testFile: 'a.js',
      }),
    ).toMatchSnapshot();

    expect(
      matchRules({
        config: web1Config!,
        testFile: 'a.js',
      }),
    ).toMatchSnapshot();
  });

  it('should merge environment and shared babel config', async () => {
    const rsbuild = await createBuilder({
      cwd: join(__dirname, '..'),
      bundlerType: 'rspack',
      config: {
        output: {
          polyfill: 'entry',
        },
        performance: {
          buildCache: false,
        },
        tools: {
          babel(config) {
            config.plugins ??= [];
            config.plugins.push([
              'babel-plugin-import',
              {
                libraryName: 'components-1',
                libraryDirectory: 'es',
                style: true,
              },
            ]);
          },
        },
        environments: {
          web: {
            tools: {
              babel(config) {
                config.plugins ??= [];
                config.plugins.push([
                  'babel-plugin-import',
                  {
                    libraryName: 'components',
                    libraryDirectory: 'es',
                    style: true,
                  },
                ]);
              },
            },
          },
          web1: {},
        },
      },
    });

    const configs = await rsbuild.initConfigs();
    const webConfig = configs.find(config => config.name === 'web');
    const web1Config = configs.find(config => config.name === 'web1');

    expect(
      matchRules({
        config: webConfig!,
        testFile: 'a.js',
      }),
    ).toMatchSnapshot();

    expect(
      matchRules({
        config: web1Config!,
        testFile: 'a.js',
      }),
    ).toMatchSnapshot();
  });
});
