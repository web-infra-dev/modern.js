import { describe, expect, it } from 'vitest';
import { createUniBuilder } from '../src';
import { matchRules, unwrapConfig } from './helper';

describe('plugin-babel (rspack mode)', () => {
  it('should not set babel-loader when babel config not modified', async () => {
    const rsbuild = await createUniBuilder({
      cwd: '',
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
    const rsbuild = await createUniBuilder({
      cwd: '',
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
    const rsbuild = await createUniBuilder({
      cwd: '',
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
    const rsbuild = await createUniBuilder({
      cwd: '',
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

describe('plugin-babel', () => {
  it('should set babel-loader', async () => {
    const rsbuild = await createUniBuilder({
      cwd: '',
      bundlerType: 'webpack',
      config: {
        output: {
          polyfill: 'entry',
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

  it('should set babel-loader separate by environment', async () => {
    const rsbuild = await createUniBuilder({
      cwd: '',
      bundlerType: 'webpack',
      config: {
        output: {
          polyfill: 'entry',
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
          web1: {
            tools: {
              babel: {},
            },
          },
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
    const rsbuild = await createUniBuilder({
      cwd: '',
      bundlerType: 'webpack',
      config: {
        output: {
          polyfill: 'entry',
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
          web1: {
            tools: {
              babel: {},
            },
          },
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

  it('should set include/exclude', async () => {
    const rsbuild = await createUniBuilder({
      cwd: '',
      bundlerType: 'webpack',
      config: {
        output: {
          polyfill: 'entry',
        },
        tools: {
          babel: (options, { addIncludes, addExcludes }) => {
            addIncludes(['src/**/*.ts']);
            addExcludes(['src/**/*.js']);
            return options;
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

  it('should apply exclude condition when using source.exclude', async () => {
    const rsbuild = await createUniBuilder({
      cwd: '',
      bundlerType: 'webpack',
      config: {
        source: {
          exclude: ['src/foo/**/*.js'],
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

  it('should add core-js-entry when output.polyfill is entry', async () => {
    const rsbuild = await createUniBuilder({
      cwd: '',
      bundlerType: 'webpack',
      config: {
        source: {
          entry: {
            main: './index.js',
          },
        },
        output: {
          polyfill: 'entry',
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

  it('should not add core-js-entry when output.polyfill is usage', async () => {
    const rsbuild = await createUniBuilder({
      cwd: '',
      bundlerType: 'webpack',
      config: {
        source: {
          entry: {
            main: './index.js',
          },
        },
        output: {
          polyfill: 'usage',
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

  it('should override targets of babel-preset-env when using output.overrideBrowserslist config', async () => {
    const rsbuild = await createUniBuilder({
      cwd: '',
      bundlerType: 'webpack',
      config: {
        output: {
          overrideBrowserslist: ['Chrome 80'],
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

  it('should adjust jsescOption config when charset is utf8', async () => {
    const rsbuild = await createUniBuilder({
      cwd: '',
      bundlerType: 'webpack',
      config: {
        output: {
          charset: 'utf8',
        },
      },
    });

    const config = await unwrapConfig(rsbuild);

    expect(JSON.stringify(config)).toContain(
      '"generatorOpts":{"jsescOption":{"minimal":true}}',
    );
  });

  it('should adjust browserslist when target is node', async () => {
    const rsbuild = await createUniBuilder({
      cwd: '',
      bundlerType: 'webpack',
      config: {
        output: {
          target: 'node',
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

  it('should set proper pluginImport option in Babel', async () => {
    // camelToDashComponentName
    const rsbuild = await createUniBuilder({
      cwd: '',
      bundlerType: 'webpack',
      config: {
        source: {
          transformImport: [
            {
              libraryName: 'foo',
              camelToDashComponentName: true,
            },
          ],
        },
      },
    });

    const config = await unwrapConfig(rsbuild);

    const babelRules = config.module!.rules?.filter((item: any) => {
      return item?.use?.[0].loader.includes('babel-loader');
    });

    expect(babelRules).toMatchSnapshot();
  });

  it('should not set default pluginImport for Babel', async () => {
    // camelToDashComponentName
    const rsbuild = await createUniBuilder({
      cwd: '',
      bundlerType: 'webpack',
      config: {},
    });
    const config = await unwrapConfig(rsbuild);

    const babelRules = config.module!.rules?.filter((item: any) => {
      return item?.use?.[0].loader.includes('babel-loader');
    });

    expect(babelRules).toMatchSnapshot();
  });

  it('should not have any pluginImport in Babel', async () => {
    // camelToDashComponentName
    const rsbuild = await createUniBuilder({
      cwd: '',
      bundlerType: 'webpack',
      config: {
        source: {
          transformImport: false,
        },
      },
    });
    const config = await unwrapConfig(rsbuild);

    const babelRules = config.module!.rules?.filter((item: any) => {
      return item?.use?.[0].loader.includes('babel-loader');
    });

    expect(babelRules).toMatchSnapshot();
  });
});
