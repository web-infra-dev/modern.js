import '@testing-library/jest-dom';
import { webpackConfigCallback } from '../src/cli';
import WebpackChain from 'webpack-chain';

jest.mock('@modern-js/core', () => {
  const originalModule = jest.requireActual('@modern-js/core');
  return {
    __esModule: true,
    ...originalModule,
    useResolvedConfigContext: () => ({
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
  test('cli webpack default config',()=>{
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
