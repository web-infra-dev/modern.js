import path from 'path';
import type {
  CliPlugin,
  ModuleTools,
  EsbuildOptions,
} from '@modern-js/module-tools';

export interface NodePolyfillPluginOptions {
  // like https://github.com/Richienb/node-polyfill-webpack-plugin#excludealiases
  excludes?: string[];
  // override built-in node polyfill config, such as `fs`.
  overrides?: Partial<Record<keyof typeof modules, string>>;
}

function filterObject(
  object: Record<string, string>,
  filter: (id: string) => boolean,
) {
  const filtered: Record<string, string> = {};
  Object.keys(object).forEach(key => {
    if (filter(key)) {
      filtered[key] = object[key];
    }
  });
  return filtered;
}
function excludeObjectKeys(object: Record<string, string>, keys: string[]) {
  return filterObject(object, key => !keys.includes(key));
}

function addResolveFallback(
  object: Record<string, string | null>,
  overrides: Record<string, string> = {},
) {
  const keys = Object.keys(object);
  const newObject: Record<string, string> = {};
  for (const key of keys) {
    if (object[key] === null) {
      newObject[key] = path.join(__dirname, `../mock/${key}.js`);
    } else {
      newObject[key] = object[key] as string;
    }
  }

  const overridesKeys = Object.keys(overrides);
  for (const key of overridesKeys) {
    if (overrides[key]) {
      newObject[key] = overrides[key];
    }
  }

  return newObject;
}

export const modules = {
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

export const modulePluginNodePolyfill = (
  polyfillOption: NodePolyfillPluginOptions = {},
): CliPlugin<ModuleTools> => ({
  name: 'polyfill-plugin',
  setup() {
    const polyfillModules = {
      ...excludeObjectKeys(
        addResolveFallback(modules, polyfillOption.overrides),
        polyfillOption.excludes ?? [],
      ),
    };
    const polyfillModulesKeys = Object.keys(polyfillModules);

    return {
      beforeBuildTask(config) {
        const lastEsbuildOptions = config.esbuildOptions;
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
        config.esbuildOptions = c => {
          const lastEsbuildConfig = lastEsbuildOptions(c);
          return {
            ...lastEsbuildConfig,
            inject: [
              ...(lastEsbuildConfig.inject ?? []),
              path.join(__dirname, 'globals.js'),
            ],
            plugins: [plugins[0], ...(lastEsbuildConfig.plugins ?? [])],
          };
        };
        return config;
      },
    };
  },
});
