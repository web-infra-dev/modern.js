import path from 'path';
import { BaseWebpackConfig } from '../src/config/base';
import { JS_REGEX, TS_REGEX } from '../src/utils/constants';
import { mergeRegex } from '../src/utils/mergeRegex';
import { userConfig } from './util';

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
        entry: path.resolve(fixtures, './demo/src/page-a/index.jsx'),
      },
    ],
    internalDirAlias: '@_modern_js_internal',
    internalSrcAlias: '@_modern_js_src',
  };
  test(`default webpack config`, () => {
    userConfig.source.include = ['query-string'];

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

    expect(config.module.rules).toContainEqual(
      expect.objectContaining({
        oneOf: expect.arrayContaining([
          expect.objectContaining({
            include: expect.arrayContaining([expect.any(Function)]),
            test: mergeRegex(JS_REGEX, TS_REGEX),
          }),
        ]),
      }),
    );
  });
});
