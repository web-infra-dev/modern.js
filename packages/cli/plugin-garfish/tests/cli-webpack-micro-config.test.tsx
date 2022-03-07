import '@testing-library/jest-dom';
import { externals, webpackConfigCallback } from '../src/cli';
import WebpackChain from 'webpack-chain';

jest.mock('@modern-js/core', () => {
  const originalModule = jest.requireActual('@modern-js/core');
  return {
    __esModule: true,
    ...originalModule,
    useResolvedConfigContext: () => {
      return {
        deploy: {
          microFrontend: {
            externalBasicLibrary: true,
            enableHtmlEntry: false,
          },
        },
        server: {
          port: '8080'
        }
      };
    },
  };
});

describe('plugin-garfish cli', () => {
  test('cli webpack microFronted',()=>{
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
        publicPath: '//localhost:8080/',
        filename: 'index.js'
      },
      externals,
      optimization: { runtimeChunk: false, splitChunks: { chunks: 'async' } }
    });
  });
});
