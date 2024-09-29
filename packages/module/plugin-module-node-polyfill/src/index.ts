import path from 'path';
import type {
  CliPlugin,
  EsbuildOptions,
  ICompiler,
  ModuleTools,
} from '@modern-js/module-tools';
import { addNodePrefix, addResolveFallback, excludeObjectKeys } from './utils';

export interface NodePolyfillPluginOptions {
  // like https://github.com/Richienb/node-polyfill-webpack-plugin#excludealiases
  excludes?: string[];
  // override built-in node polyfill config, such as `fs`.
  overrides?: Partial<Record<keyof typeof modules, string>>;
}

let modules = {
  assert: require.resolve('assert/'),
  buffer: require.resolve('buffer/'),
  child_process: null,
  cluster: null,
  console: require.resolve('console-browserify'),
  constants: require.resolve('constants-browserify'),
  crypto: require.resolve('crypto-browserify'),
  dgram: null,
  dns: null,
  domain: require.resolve('domain-browser'),
  events: require.resolve('events/'),
  fs: null,
  http: require.resolve('stream-http'),
  https: require.resolve('https-browserify'),
  module: null,
  net: null,
  os: require.resolve('os-browserify/browser'),
  path: require.resolve('path-browserify'),
  punycode: require.resolve('punycode/'),
  process: require.resolve('process/browser'),
  querystring: require.resolve('querystring-es3'),
  readline: null,
  repl: null,
  stream: require.resolve('stream-browserify'),
  _stream_duplex: require.resolve('readable-stream/lib/_stream_duplex'),
  _stream_passthrough: require.resolve(
    'readable-stream/lib/_stream_passthrough',
  ),
  _stream_readable: require.resolve('readable-stream/lib/_stream_readable'),
  _stream_transform: require.resolve('readable-stream/lib/_stream_transform'),
  _stream_writable: require.resolve('readable-stream/lib/_stream_writable'),
  string_decoder: require.resolve('string_decoder/'),
  sys: require.resolve('util/'),
  timers: require.resolve('timers-browserify'),
  tls: null,
  tty: require.resolve('tty-browserify'),
  url: require.resolve('url/'),
  util: require.resolve('util/'),
  vm: require.resolve('vm-browserify'),
  zlib: require.resolve('browserify-zlib'),
};

export const getNodePolyfillHook = (
  polyfillOption: NodePolyfillPluginOptions = {},
) => {
  const nodeModules = addNodePrefix(modules);
  modules = Object.assign(modules, nodeModules);
  const polyfillModules = {
    ...excludeObjectKeys(
      addResolveFallback(modules, polyfillOption.overrides),
      polyfillOption.excludes ?? [],
    ),
  };
  const polyfillModulesKeys = Object.keys(polyfillModules);
  return {
    name: 'node-polyfill',
    apply(compiler: ICompiler) {
      const plugins: NonNullable<ReturnType<EsbuildOptions>['plugins']> = [
        {
          name: 'example',
          setup(build) {
            build.onResolve({ filter: /.*/ }, args => {
              if (polyfillModulesKeys.includes(args.path)) {
                return {
                  path: polyfillModules[args.path],
                };
              }
              return undefined;
            });
          },
        },
      ];
      const lastBuildOptions = compiler.buildOptions;
      compiler.buildOptions = {
        ...lastBuildOptions,
        inject: [
          ...(lastBuildOptions.inject ?? []),
          path.join(__dirname, 'globals.js'),
        ],
        plugins: [plugins[0], ...(lastBuildOptions.plugins ?? [])],
      };
    },
  };
};

export const modulePluginNodePolyfill = (
  polyfillOption: NodePolyfillPluginOptions = {},
): CliPlugin<ModuleTools> => ({
  name: '@modern-js/plugin-module-node-polyfill',
  setup() {
    return {
      beforeBuildTask(config) {
        const hook = getNodePolyfillHook(polyfillOption);
        config.hooks.push(hook);
        return config;
      },
    };
  },
});
