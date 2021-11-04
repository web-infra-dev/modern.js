/**
 * Cheng, 22 Oct, 2020
 * internally use rollup-plugin-node-polyfills
 */
import { randomBytes } from 'crypto';
import path from 'path';
import inject from '@rollup/plugin-inject';
import type { Plugin } from 'rollup';

const defaultOptions = {};

export function rollupPluginNodePolyfills(
  opts: NodePolyfillsOptions = defaultOptions,
): Plugin {
  const injectPlugin = inject({
    include: opts.include === undefined ? /node_modules\/.*\.js/ : undefined,
    exclude: opts.exclude,
    sourceMap: opts.sourceMap as any,
    modules: {
      process: 'process',
      Buffer: ['buffer', 'Buffer'],
      global: GLOBAL_PATH,
      __filename: FILENAME_PATH,
      __dirname: DIRNAME_PATH,
    },
  });
  const basedir = opts.baseDir || '/';
  const dirs = new Map<string, string>();
  const resolver = builtinsResolver(opts);
  return {
    name: 'node-polyfills',
    resolveId(importee, importer) {
      if (importee === DIRNAME_PATH) {
        const id = `\0${getRandomId()}`;
        dirs.set(id, path.dirname('/' + path.relative(basedir, importer!)));
        return { id, moduleSideEffects: false };
      }
      if (importee === FILENAME_PATH) {
        const id = `\0${getRandomId()}`;
        dirs.set(id, path.dirname('/' + path.relative(basedir, importer!)));
        return { id, moduleSideEffects: false };
      }
      const _id = getUnwrapId(importee);
      return resolver(_id);
    },
    load(id: string) {
      if (dirs.has(id)) {
        return `export default '${dirs.get(id)!}'`;
      }
      const realId = getUnwrapId(id);
      // it wrapped, load a virtual module
      if (realId !== id) {
        const exports = require(realId);
        let allKeys: string[] = [];
        try {
          allKeys = Object.keys(exports);
        } catch (e) {
          // no-catch
        }
        const code = `
if (!window.require) {
  throw new Error('Can not require ${realId}');
}
const _${realId} = window.require(${JSON.stringify(realId)});
export default _${realId};
${allKeys.length ? `export const { ${allKeys.join(',')} } = _${realId}` : ''}
`;
        return code;
      }
    },
    transform(code: string, id: string) {
      const transformed = injectPlugin.transform!.call(this, code, id);
      return transformed;
    },
  };
}

function getRandomId() {
  return randomBytes(15).toString('hex');
}

const GLOBAL_PATH = require.resolve(
  'rollup-plugin-node-polyfills/polyfills/global.js',
);
const DIRNAME_PATH = '\0node-polyfills___dirname';
const FILENAME_PATH = '\0node-polyfills___filename';

const EMPTY_PATH = require.resolve(
  'rollup-plugin-node-polyfills/polyfills/empty.js',
);

const WRAP_PREFIX = '\0node-polyfills___';
const getWrapId = (id: string) => `${WRAP_PREFIX}${id}`;
const getUnwrapId = (wrapId: string) => wrapId.replace(WRAP_PREFIX, '');

const featureInfo = {
  process: require.resolve(
    'rollup-plugin-node-polyfills/polyfills/process-es6',
  ),

  buffer: require.resolve('rollup-plugin-node-polyfills/polyfills/buffer-es6'),

  util: require.resolve('rollup-plugin-node-polyfills/polyfills/util'),

  sys: require.resolve('rollup-plugin-node-polyfills/polyfills/util'),

  events: require.resolve('rollup-plugin-node-polyfills/polyfills/events'),

  stream: require.resolve('rollup-plugin-node-polyfills/polyfills/stream'),

  path: require.resolve('rollup-plugin-node-polyfills/polyfills/path'),

  querystring: require.resolve('rollup-plugin-node-polyfills/polyfills/qs'),

  punycode: require.resolve('rollup-plugin-node-polyfills/polyfills/punycode'),

  url: require.resolve('rollup-plugin-node-polyfills/polyfills/url'),

  string_decoder: require.resolve(
    'rollup-plugin-node-polyfills/polyfills/string-decoder',
  ),

  http: require.resolve('rollup-plugin-node-polyfills/polyfills/http'),

  https: require.resolve('rollup-plugin-node-polyfills/polyfills/http'),

  os: require.resolve('rollup-plugin-node-polyfills/polyfills/os'),

  assert: require.resolve('rollup-plugin-node-polyfills/polyfills/assert'),

  constants: require.resolve(
    'rollup-plugin-node-polyfills/polyfills/constants',
  ),

  _stream_duplex: require.resolve(
    'rollup-plugin-node-polyfills/polyfills/readable-stream/duplex',
  ),

  _stream_passthrough: require.resolve(
    'rollup-plugin-node-polyfills/polyfills/readable-stream/passthrough',
  ),

  _stream_readable: require.resolve(
    'rollup-plugin-node-polyfills/polyfills/readable-stream/readable',
  ),

  _stream_writable: require.resolve(
    'rollup-plugin-node-polyfills/polyfills/readable-stream/writable',
  ),

  _stream_transform: require.resolve(
    'rollup-plugin-node-polyfills/polyfills/readable-stream/transform',
  ),

  timers: require.resolve('rollup-plugin-node-polyfills/polyfills/timers'),

  console: require.resolve('rollup-plugin-node-polyfills/polyfills/console'),

  vm: require.resolve('rollup-plugin-node-polyfills/polyfills/vm'),

  zlib: require.resolve('rollup-plugin-node-polyfills/polyfills/zlib'),

  tty: require.resolve('rollup-plugin-node-polyfills/polyfills/tty'),

  domain: require.resolve('rollup-plugin-node-polyfills/polyfills/domain'),

  // not shimmed
  dns: EMPTY_PATH,
  dgram: EMPTY_PATH,
  child_process: EMPTY_PATH,
  cluster: EMPTY_PATH,
  module: EMPTY_PATH,
  net: EMPTY_PATH,
  readline: EMPTY_PATH,
  repl: EMPTY_PATH,
  tls: EMPTY_PATH,
  // fs: EMPTY_PATH,
  // crypto: EMPTY_PATH,

  fs: require.resolve('rollup-plugin-node-polyfills/polyfills/browserify-fs'),
  crypto: require.resolve(
    'rollup-plugin-node-polyfills/polyfills/crypto-browserify',
  ),
};

type FeatureOptions<T = typeof featureInfo> = {
  /**
   * true - use featureInfo
   * empty - empty_path
   * wrap - internal use window.require, export as ESM
   */
  [key in keyof T]?: true | 'empty' | 'wrap';
};

export interface NodePolyfillsOptions extends FeatureOptions {
  sourceMap?: boolean;
  baseDir?: string;
  include?: Array<string | RegExp> | string | RegExp | null;
  exclude?: Array<string | RegExp> | string | RegExp | null;
  /**
   * If electron, all polyfill use a window.require wrap
   */
  target?: 'electron';
}

type FeatureKeys = keyof typeof featureInfo;

const defaultFeatureOptions: Required<FeatureOptions> = {
  process: true,
  buffer: true,
  util: true,
  sys: true,
  events: true,
  stream: true,
  path: true,
  querystring: true,
  punycode: true,
  url: true,
  string_decoder: true,
  http: true,
  https: true,
  os: true,
  assert: true,
  constants: true,
  _stream_duplex: true,
  _stream_passthrough: true,
  _stream_readable: true,
  _stream_writable: true,
  _stream_transform: true,
  timers: true,
  console: true,
  vm: true,
  zlib: true,
  tty: true,
  domain: true,

  // not shimmed
  dns: true,
  dgram: true,
  child_process: true,
  cluster: true,
  module: true,
  net: true,
  readline: true,
  repl: true,
  tls: true,
  fs: 'empty',
  crypto: 'empty',
};

export function builtinsResolver(_opts: NodePolyfillsOptions) {
  const opts = _opts;
  Object.keys(defaultFeatureOptions).forEach(_k => {
    const k = _k as FeatureKeys;
    if (opts.target === 'electron') {
      opts[k] = 'wrap';
      return;
    }
    if (opts[k] === undefined) {
      opts[k] = defaultFeatureOptions[k];
    }
  });

  const libs = new Map();

  Object.keys(featureInfo).forEach(_k => {
    const k = _k as FeatureKeys;
    if (!opts[k]) {
      return;
    }
    switch (opts[k]) {
      case 'empty': {
        libs.set(k, EMPTY_PATH);
        break;
      }
      case 'wrap': {
        libs.set(k, getWrapId(k));
        break;
      }
      default: {
        libs.set(k, featureInfo[k]);
        break;
      }
    }
  });

  return (importee: string) => {
    if (importee && importee.slice(-1) === '/') {
      importee = importee.slice(0, -1);
    }
    if (libs.has(importee)) {
      return { id: libs.get(importee), moduleSideEffects: false };
    }
    return null;
  };
}
