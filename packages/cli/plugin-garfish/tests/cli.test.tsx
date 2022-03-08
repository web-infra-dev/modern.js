import '@testing-library/jest-dom';
import GarfishPlugin, { externals, makeRenderFunction, webpackConfigCallback } from '../src/cli';
import WebpackChain from 'webpack-chain';

jest.mock('@modern-js/core', () => {
  const originalModule = jest.requireActual('@modern-js/core');
  return {
    __esModule: true,
    ...originalModule,
    useResolvedConfigContext: () => ({
      runtime: {
        masterApp: {},
      },
      deploy: {
        microFrontend: true,
      },
      server: {
        port: '8080'
      }
    }),
  };
});

describe('plugin-garfish cli', () => {
  test('cli garfish basename', () => {
    expect(GarfishPlugin.name).toBe('@modern-js/plugin-garfish');
    const pluginLifeCycle = GarfishPlugin.initializer();
    const basename = '/test';
    const resolveConfig = {
      resolved: {
        runtime: {
          router: {
            historyOptions: { basename }
          },
          masterApp: {}
        }
      }
    };
    expect((pluginLifeCycle as any).resolvedConfig(resolveConfig).resolved.runtime.masterApp.basename).toBe(basename);
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
    expect(generateNewRenderFn({ basename: '/test' }, true, true)).toMatchObject({
      renderByProvider: true,
      routerConfig: {
        basename: '/test',
        historyOptions: {
          basename: '/test'
        }
      }
    });
  });

  test('cli webpack config',()=>{
    const webpackConfig = new WebpackChain();

    webpackConfigCallback({}, {
      chain: webpackConfig,
      webpack: jest.fn(),
      env: 'development'
    });

    const generateConfig = webpackConfig.toConfig();
    expect(generateConfig).toMatchObject({
      output: {
        libraryTarget: 'umd',
        publicPath: '//localhost:8080/'
      }
    });
    expect(generateConfig.externals).toBeUndefined();
    expect(generateConfig.output.filename).toBeUndefined();
  });
});
