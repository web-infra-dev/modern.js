import { IAppContext, NormalizedConfig } from '@modern-js/core';
import { ClientWebpackConfig } from '../src/config/client';

describe('@modern-js/webpack#config/client', () => {
  it('ClientWebpackConfig', () => {
    const appContext: IAppContext = {
      metaName: 'modern-js',
      appDirectory: __dirname,
      distDirectory: `${__dirname}/dist`,
      srcDirectory: `${__dirname}/src`,
      entrypoints: [
        {
          entryName: 'main',
          entry: `${__dirname}/node_modules/.modern-js/main/index.js`,
        },
      ],
    } as any;
    const options: NormalizedConfig = {
      source: {} as any,
      tools: {} as any,
      _raw: {} as any,
      server: {} as any,
      dev: {} as any,
      deploy: {} as any,
      plugins: [] as any,
      runtime: {} as any,
      runtimeByEntries: {} as any,
      output: {
        path: `${__dirname}/dist`,
        jsPath: 'js',
        cssPath: 'css',
        disableAssetsCache: true,
        disableNodePolyfill: false,
      },
    };
    const client: any = new ClientWebpackConfig(appContext, options);
    const z = client.getNodePolyfill();
    expect(z.readline).toBeFalsy();
    expect(Object.keys(z)).toEqual([
      'assert',
      'buffer',
      'child_process',
      'cluster',
      'console',
      'constants',
      'crypto',
      'dgram',
      'dns',
      'domain',
      'events',
      'fs',
      'http',
      'https',
      'module',
      'net',
      'os',
      'path',
      'punycode',
      'process',
      'querystring',
      'readline',
      'repl',
      'stream',
      '_stream_duplex',
      '_stream_passthrough',
      '_stream_readable',
      '_stream_transform',
      '_stream_writable',
      'string_decoder',
      'sys',
      'timers',
      'tls',
      'tty',
      'url',
      'util',
      'vm',
      'zlib',
    ]);

    const getCustomPublicEnv = jest.spyOn(client, 'getCustomPublicEnv');
    client.useDefinePlugin();
    expect(getCustomPublicEnv).toBeCalled();
  });
});
