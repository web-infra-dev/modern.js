import path from 'path';
import { userConfig } from './util';
import { NodeWebpackConfig } from '../src/config/node';

describe('node webpack config', () => {
  const fixtures = path.resolve(__dirname, './fixtures');
  const appContext = {
    internalDirectory: '/node_modules/.modern-js',
    srcDirectory: '/src',
    sharedDirectory: './shared',
    appDirectory: fixtures,
    entrypoints: [
      {
        entryName: 'page-a',
        entryPath: path.resolve(fixtures, './demo/src/page-a/index.jsx'),
      },
    ],
  };
  test(`webpack config target should be node`, () => {
    const config = new NodeWebpackConfig(
      appContext as any,
      userConfig as any,
    ).config();

    expect(config.target).toEqual('node');

    expect(config.devtool).toBe(false);

    expect(config.output?.filename).toBe('bundles/[name].js');

    expect(config.output?.libraryTarget).toBe('commonjs2');

    expect(config.optimization?.splitChunks).toBe(false);

    expect(config.optimization?.runtimeChunk).toBe(false);

    // TODO: css & babel
  });
});
