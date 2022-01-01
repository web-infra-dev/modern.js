import path from 'path';
import { userConfig } from './util';
import { BaseWebpackConfig } from '../src/config/base';

describe('base webpack config', () => {
  const fixtures = path.resolve(__dirname, './fixtures');
  const appContext = {
    appDirectory: fixtures,
    internalDirectory: '/node_modules/.modern-js',
    srcDirectory: '/src',
    sharedDirectory: './shared',
    entrypoints: [
      {
        entryName: 'page-a',
        entryPath: path.resolve(fixtures, './demo/src/page-a/index.jsx'),
      },
    ],
  };
  test(`default webpack config`, () => {
    const config = new BaseWebpackConfig(
      appContext as any,
      userConfig as any,
    ).config();

    // todo fix
    // expect(config.output).toEqual(
    //   expect.objectContaining({
    //     filename: 'static/js/[name].js',
    //     chunkFilename: 'static/js/[id].js',
    //     globalObject: 'window',
    //     publicPath: '/',
    //     assetModuleFilename: 'static/media/[name].[hash:8][ext]',
    //   }),
    // );

    expect(config.optimization?.splitChunks).toEqual({ chunks: 'all' });

    expect(config.cache).toHaveProperty('type', 'filesystem');
  });
});
