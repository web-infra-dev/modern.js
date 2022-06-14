import '@testing-library/jest-dom';
import { manager } from '@modern-js/core';
import WebpackChain from 'webpack-chain';
import GarfishPlugin, { externals } from '../src/cli';
import type { UseConfig } from '../src/cli';
import { getRuntimeConfig, makeRenderFunction, setRuntimeConfig } from '../src/cli/utils';
import { CHAIN_ID } from '@modern-js/utils';

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

    function HTMLWebpackPlugin() {};
    webpackConfig.plugin('html-main').use(HTMLWebpackPlugin);


    config[0].tools.webpackChain(webpackConfig, {
      webpack: jest.fn(),
      env: 'development',
      CHAIN_ID,
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
    function HTMLWebpackPlugin() {};
    webpackConfig.plugin('html-main').use(HTMLWebpackPlugin);

    config[0].tools.webpackChain(webpackConfig, {
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


  test('micro fronted default config disableCssExtract false', async ()=>{
    const resolveConfig: Partial<UseConfig> = {
      deploy: {
        microFrontend: {},
      }
    };

    const main = manager.clone({
      useResolvedConfigContext: ()=> resolveConfig as any,
      useConfigContext: ()=> resolveConfig,
    }).usePlugin(GarfishPlugin);

    const runner = await main.init();
    await runner.prepare();
    const config = await runner.config();
    expect(config[0].output.disableCssExtract).toBe(false);
  });

  test('micro fronted js entry disableCssExtract true', async ()=>{
    const resolveConfig: Partial<UseConfig> = {
      output: {
        disableCssExtract: false
      },
      deploy: {
        microFrontend: {
          enableHtmlEntry: false,
        },
      }
    };

    const main = manager.clone({
      useResolvedConfigContext: ()=>resolveConfig as any,
      useConfigContext: ()=> resolveConfig,
    }).usePlugin(GarfishPlugin);
    const runner = await main.init();
    await runner.prepare();
    const config = await runner.config();
    expect(config[0].output.disableCssExtract).toBe(true);
  });

  test('normal disableCssExtract false', async ()=>{
    const resolveConfig: Partial<UseConfig> = {};

    const main = manager.clone({
      useResolvedConfigContext: ()=>resolveConfig as any,
      useConfigContext: ()=> resolveConfig,
    }).usePlugin(GarfishPlugin);
    const runner = await main.init();
    await runner.prepare();
    const config = await runner.config();
    expect(config[0].output.disableCssExtract).toBe(false);
  });
});
