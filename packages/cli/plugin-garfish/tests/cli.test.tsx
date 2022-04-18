import '@testing-library/jest-dom';
import { Hooks, manager, ToRunners } from '@modern-js/core';
import WebpackChain from 'webpack-chain';
import GarfishPlugin, { externals } from '../src/cli';
import { getRuntimeConfig, makeRenderFunction, setRuntimeConfig } from '../src/cli/utils';

const addExportList = [];
jest.mock('@modern-js/utils', () => {
  const originalModule = jest.requireActual('@modern-js/utils');
  return {
    __esModule: true,
    ...originalModule,
    createRuntimeExportsUtils: ()=>({
      addExport: (val: any)=> {
        addExportList.push(val);
      },
      getPath: ()=> 'test',
    }),
  }
});

describe('plugin-garfish cli', () => {
  test('cli garfish basename', async () => {
    expect(GarfishPlugin().name).toBe('@modern-js/plugin-garfish');

    const main = manager.clone().usePlugin(GarfishPlugin);
    const runner = await main.init();
    await runner.prepare();
    const configHistoryOptions: any = await runner.resolvedConfig({
      resolved: {
        runtime: {
          router: {
            historyOptions: { basename: '/test' }
          },
          masterApp: {}
        },
      }
    } as any);

    expect(configHistoryOptions.resolved.runtime.masterApp.basename).toBe('/test');

    const configHistory: any = await runner.resolvedConfig({
      resolved: {
        runtime: {
          router: {
            basename: '/test2'
          },
          masterApp: {}
        },
      }
    } as any);

    expect(configHistory.resolved.runtime.masterApp.basename).toBe('/test2');
  });

  test('cli get runtime config', ()=>{
    const runtimeConfig = getRuntimeConfig({
      runtime: {
        masterApp: {
          basename: '/test'
        }
      }
    });
    expect(runtimeConfig).toMatchSnapshot();
  });

  test('cli get runtime features config', ()=>{
    const runtimeConfig = getRuntimeConfig({
      runtime: {
        masterApp: {
          basename: '/test'
        },
        features: {
          masterApp: {
            basename: '/test2'
          }
        }
      }
    });

    expect(runtimeConfig).toMatchSnapshot();
  });

  test('cli set runtime config', ()=>{
    const runtimeConfig = {
      runtime: {
        masterApp: {
          basename: '/test'
        }
      }
    };

    setRuntimeConfig(runtimeConfig, 'masterApp', true);

    expect(runtimeConfig.runtime).toMatchSnapshot();
  });

  test('cli set runtime features config', ()=>{
    const runtimeConfig = {
      runtime: {
        features: {
          masterApp: {
            basename: '/test'
          }
        }
      }
    };

    setRuntimeConfig(runtimeConfig, 'masterApp', true);

    expect(runtimeConfig.runtime).toMatchSnapshot();
  });

  test('cli makeRender function', ()=>{
    const code = `
      const router = (config)=> config;
      const App = {};
      const routerConfig = router({...App?.config?.router, ...App?.config?.features?.router});
      const resultConfig = {
        routerConfig,
        renderByProvider: true,
      };

      if (IS_BROWSER) {
        resultConfig.renderByProvider = false;
      }
      return resultConfig;
    `;
    const generateNewRenderFn = new Function('appInfo', 'IS_BROWSER', '__GARFISH_EXPORTS__', makeRenderFunction(code));

    // render byGarfish but don't provider appInfo
    expect(generateNewRenderFn(undefined, true, false)).toBe(null);

    // run alone
    expect(generateNewRenderFn(undefined, true)).toMatchObject({
      renderByProvider: false
    });

    // render ByGarfish and provider appInfo
    expect(generateNewRenderFn({ basename: '/test' }, true, true)).toMatchSnapshot();
  });


  test('webpack config close external and use js entry', async ()=>{
    const resolveConfig: any = {
      deploy: {
        microFrontend: {
          externalBasicLibrary: true,
          enableHtmlEntry: false,
        },
      },
      server: {
        port: 8080
      }
    };

    const main = manager.clone({
      useResolvedConfigContext: ()=>resolveConfig
    }).usePlugin(GarfishPlugin);

    const runner = await main.init();
    await runner.prepare();
    const config: any = await runner.config();
    const webpackConfig = new WebpackChain();

    config[0].tools.webpack({}, {
      chain: webpackConfig,
      webpack: jest.fn(),
      env: 'development'
    });

    const generateConfig = webpackConfig.toConfig();
    expect(generateConfig).toMatchSnapshot();
    expect(generateConfig).toMatchObject({
      output: {
        libraryTarget: 'umd',
        publicPath: '//localhost:8080/',
        filename: 'index.js'
      },
      externals,
      optimization: { runtimeChunk: false, splitChunks: { chunks: 'async' } }
    });
  })

  test('webpack config default micro config', async ()=>{
    const resolveConfig: any = {
      deploy: {
        microFrontend: true,
      },
      server: {
        port: '8080'
      }
    };

    const main = manager.clone({
      useResolvedConfigContext: ()=>resolveConfig
    }).usePlugin(GarfishPlugin);
    const runner = await main.init();
    await runner.prepare();
    const config: any = await runner.config();
    const webpackConfig = new WebpackChain();

    config[0].tools.webpack({}, {
      chain: webpackConfig,
      webpack: jest.fn(),
      env: 'development'
    });

    const generateConfig = webpackConfig.toConfig();
    expect(config[0].tools.devServer).toMatchObject({
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
    });

    expect(generateConfig).toMatchSnapshot();
    expect(generateConfig).toMatchObject({
      output: {
        libraryTarget: 'umd',
        publicPath: '//localhost:8080/'
      }
    });
    expect(generateConfig.externals).toBeUndefined();
    expect(generateConfig.output.filename).toBeUndefined();
  });

  test('cli addRuntimeExports', async ()=>{
    const resolveConfig: any = {};
    const mfPackagePath = '@modern-js/test/plugin-garfish';
    const plugin = GarfishPlugin({
      mfPackagePath,
    });

    const lifecycle = await plugin.setup({
      useResolvedConfigContext: () => resolveConfig,
      useAppContext: ()=>({
        internalDirectory: 'test'
      }),
    } as any);

    lifecycle && lifecycle.config();
    lifecycle && lifecycle.addRuntimeExports()
    expect(addExportList).toMatchSnapshot();
  });
});
