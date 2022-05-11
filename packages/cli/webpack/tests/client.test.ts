import { fs } from '@modern-js/utils';
import { IAppContext, NormalizedConfig } from '@modern-js/core';
import { ClientWebpackConfig } from '../src/config/client';

describe('@modern-js/webpack#config/client', () => {
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
    source: {
      configDir: '/',
    },
    tools: {},
    _raw: {},
    server: {},
    dev: {},
    deploy: {},
    plugins: [],
    runtime: {},
    runtimeByEntries: {},
    output: {
      path: `${__dirname}/dist`,
      jsPath: 'js',
      cssPath: 'css',
      disableAssetsCache: true,
      disableNodePolyfill: false,
    },
  } as any;

  it('ClientWebpackConfig', () => {
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

  it('should register CopyPlugin when upload/public dir is existed', done => {
    const fsSpy = jest.spyOn(fs, 'existsSync');
    fsSpy.mockReturnValue(true);

    const client = new ClientWebpackConfig(appContext, options);

    client.plugins();

    client.chain.plugin('copy').tap(options => {
      expect(options[0].patterns.length).toEqual(2);
      done();
      return options;
    });

    fsSpy.mockRestore();
  });

  it('should not register CopyPlugin when upload/public dir is not existed', () => {
    const fsSpy = jest.spyOn(fs, 'existsSync');
    fsSpy.mockReturnValue(false);

    const client = new ClientWebpackConfig(appContext, options);

    client.plugins();

    expect(() => {
      client.chain.plugin('copy').tap(options => options);
    }).toThrowError();

    fsSpy.mockRestore();
  });
});
