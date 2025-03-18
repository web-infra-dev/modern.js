import '@testing-library/jest-dom';
import { type AppTools } from '@modern-js/app-tools';
import WebpackChain from '@modern-js/utils/webpack-chain';
import { garfishPlugin, externals } from '../src/cli';
import { getRuntimeConfig, setRuntimeConfig } from '../src/cli/utils';
import { createPluginManager, Plugin } from '@modern-js/plugin-v2';
import runtimePlugin from '@modern-js/runtime/cli';
import { createContext, initPluginAPI } from '@modern-js/plugin-v2/cli';
import path from 'path';

const CHAIN_ID = {
  PLUGIN: {
    HTML: 'html',
  },
};

async function setup(config: any) {
  const pluginManager = createPluginManager();

  pluginManager.addPlugins([runtimePlugin() as Plugin, garfishPlugin() as Plugin]);
  const plugins = pluginManager.getPlugins();
  const context = await createContext<AppTools>({
    appContext: {
      plugins,
      appDirectory: path.join(__dirname, './feature'),
    } as any,
    config: config,
    normalizedConfig: { ...config, plugins: [] } as any,
  });
  const pluginAPI = {
    ...initPluginAPI<AppTools>({
      context,
      pluginManager,
    }),
    checkEntryPoint: ({ path, entry }: any) => {
      return { path, entry };
    },
    modifyEntrypoints: ({ entrypoints }: any) => {
      return { entrypoints };
    },
    generateEntryCode: async ({ entrypoints }: any) => {},
    _internalRuntimePlugins: ({ entrypoint, plugins }: any) => {
      return { entrypoint, plugins };
    },
    addRuntimeExports: () => {},
    modifyFileSystemRoutes: () => {},
    onBeforeGenerateRoutes: () => {},
  };
  pluginAPI.config(() => {
    return config
  })
  pluginAPI.modifyResolvedConfig(() => {
    return config
  })
  for (const plugin of plugins) {
    await plugin.setup(pluginAPI);
  }
  return pluginAPI;
}

describe('plugin-garfish cli', () => {
  test('cli garfish instance', async () => {
    expect(garfishPlugin().name).toBe('@modern-js/plugin-garfish');
  });

  test('test config historyOptions', async () => {
    const pluginAPI = await setup({
      runtime: {
        router: {
          historyOptions: { basename: '/test' },
        },
        masterApp: {},
      },
    });
    const hooks = pluginAPI.getHooks();
    const configHistory: any = await hooks.modifyResolvedConfig.call({} as any);
    expect(configHistory.runtime.masterApp.basename).toBe(
      '/test',
    );
  })

  test('test config basename', async () => {
    const pluginAPI = await setup({
      runtime: {
        router: {
          basename: '/test2',
        },
        masterApp: {},
      },
    });
    const hooks = pluginAPI.getHooks();
    const configHistory: any = await hooks.modifyResolvedConfig.call({} as any);
    expect(configHistory.runtime.masterApp.basename).toBe(
      '/test2',
    );
  })

  test('cli get runtime config', () => {
    const runtimeConfig = getRuntimeConfig({
      runtime: {
        masterApp: {
          basename: '/test',
        },
      },
    });
    expect(runtimeConfig).toMatchSnapshot();
  });

  test('cli get runtime features config', () => {
    const runtimeConfig = getRuntimeConfig({
      runtime: {
        masterApp: {
          basename: '/test',
        },
        features: {
          masterApp: {
            basename: '/test2',
          },
        },
      },
    });

    expect(runtimeConfig).toMatchSnapshot();
  });

  test('cli set runtime config', () => {
    const runtimeConfig = {
      runtime: {
        masterApp: {
          basename: '/test',
        },
      },
    };

    setRuntimeConfig(runtimeConfig, 'masterApp', true);

    expect(runtimeConfig.runtime).toMatchSnapshot();
  });

  test('cli set runtime features config', () => {
    const runtimeConfig = {
      runtime: {
        features: {
          masterApp: {
            basename: '/test',
          },
        },
      },
    };

    setRuntimeConfig(runtimeConfig, 'masterApp', true);

    expect(runtimeConfig.runtime).toMatchSnapshot();
  });

  test('webpack config close external and use js entry', async () => {
    const webpackConfig = new WebpackChain();
    function HTMLWebpackPlugin() {}
    webpackConfig.plugin('html-main').use(HTMLWebpackPlugin);
    const pluginAPI = await setup({
      deploy: {
        microFrontend: {
          externalBasicLibrary: true,
          enableHtmlEntry: false,
        },
      },
      server: {
        port: 8080,
      },
    });
    const hooks = pluginAPI.getHooks();
    const configs: any = await hooks.config.call();
    configs[5].tools.bundlerChain(webpackConfig, {
      webpack: jest.fn(),
      env: 'development',
      CHAIN_ID,
      bundler: {
        BannerPlugin: class {
          params: any;

          constructor(params: any) {
            this.params = params;
          }
        },
      }
    });
    const generateConfig = webpackConfig.toConfig();
    expect(generateConfig).toMatchSnapshot();
    expect(generateConfig).toMatchObject({
      output: {
        libraryTarget: 'umd',
        filename: 'index.js',
      },
      externals,
      optimization: { runtimeChunk: false, splitChunks: { chunks: 'async' } },
    });

  })

  test('webpack config default micro config', async () => {
    const webpackConfig = new WebpackChain();
    function HTMLWebpackPlugin() {}
    webpackConfig.plugin('html-main').use(HTMLWebpackPlugin);
    const pluginAPI = await setup({
      deploy: {
        microFrontend: true,
      },
      server: {
        port: '8080',
      },
    });
    const hooks = pluginAPI.getHooks();
    const configs: any = await hooks.config.call();
    configs[5].tools.bundlerChain(webpackConfig, {
      webpack: jest.fn(),
      env: 'development',
      CHAIN_ID,
      bundler: {
        BannerPlugin: class {
          params: any;

          constructor(params: any) {
            this.params = params;
          }
        },
      }
    });
    const generateConfig = webpackConfig.toConfig();
    expect(configs[5].tools.devServer).toMatchObject({
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
    });

    expect(generateConfig).toMatchSnapshot();
    expect(generateConfig).toMatchObject({
      output: {
        libraryTarget: 'umd',
      },
    });
    expect(generateConfig.externals).toBeUndefined();
    expect(generateConfig.output!.filename).toBeUndefined();
  })

  test('micro fronted default config disableCssExtract false', async () => {
    const pluginAPI = await setup({
      deploy: {
        microFrontend: {},
      },
    });
    const hooks = pluginAPI.getHooks();
    const configs: any = await hooks.config.call();
    expect(configs[5].output!.disableCssExtract).toBe(false);
  })

  test('micro fronted js entry disableCssExtract true', async () => {
    const pluginAPI = await setup({
      output: {
        disableCssExtract: false,
      },
      deploy: {
        microFrontend: {
          enableHtmlEntry: false,
        },
      },
    });
    const hooks = pluginAPI.getHooks();
    const configs: any = await hooks.config.call();
    expect(configs[5].output!.disableCssExtract).toBe(true);
  })

  test('normal disableCssExtract false', async () => {
    const pluginAPI = await setup({})
    const hooks = pluginAPI.getHooks();
    const configs: any = await hooks.config.call();
    expect(configs[5].output!.disableCssExtract).toBe(false);
  })

});
