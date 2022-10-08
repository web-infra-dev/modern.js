import assert from 'assert';
import type * as webpack from 'webpack';
import { URLSearchParams } from 'url';
import _ from '@modern-js/utils/lodash';
import type Buffer from 'buffer';
import { DEFAULT_DATA_URL_SIZE } from './constants';
import type { SomeJSONSchema } from '@modern-js/utils/ajv/json-schema';
import { BuilderConfig, BuilderOptions, DataUriLimit } from '../types';

export const JS_REGEX = /\.(js|mjs|cjs|jsx)$/;
export const TS_REGEX = /\.(ts|mts|cts|tsx)$/;
export const CSS_REGEX = /\.css$/;
export const LESS_REGEX = /\.less$/;
export const SASS_REGEX = /\.s(a|c)ss$/;
export const CSS_MODULE_REGEX = /\.module\.css$/;
export const GLOBAL_CSS_REGEX = /\.global\.css$/;
export const NODE_MODULES_REGEX = /node_modules/;
export const SVG_REGEX = /\.svg$/;
export const MODULE_PATH_REGEX =
  /[\\/]node_modules[\\/](\.pnpm[\\/])?(?:(@[^[\\/]+)(?:[\\/]))?([^\\/]+)/;

export const isNodeModulesCss = (path: string) =>
  NODE_MODULES_REGEX.test(path) &&
  CSS_REGEX.test(path) &&
  !CSS_MODULE_REGEX.test(path);

export const mergeRegex = (...regexes: (string | RegExp)[]): RegExp => {
  assert(
    regexes.length,
    'mergeRegex: regular expression array should not be empty.',
  );
  const sources = regexes.map(regex =>
    regex instanceof RegExp ? regex.source : regex,
  );

  return new RegExp(sources.join('|'));
};

export function pick<T, U extends keyof T>(obj: T, keys: ReadonlyArray<U>) {
  return keys.reduce((ret, key) => {
    if (obj[key] !== undefined) {
      ret[key] = obj[key];
    }
    return ret;
  }, {} as Pick<T, U>);
}

/** Preserving the details of schema by generic types. */
export const defineSchema = <T extends SomeJSONSchema>(schema: T): T => schema;

export function getRegExpForExts(extensions: string[]): RegExp {
  return new RegExp(
    `\\.(${extensions
      .map(ext => ext.trim())
      .map(ext => (ext.startsWith('.') ? ext.slice(1) : ext))
      .join('|')})$`,
    'i',
  );
}

export const getDataUrlLimit = (
  config: BuilderConfig,
  type: keyof DataUriLimit,
) => {
  const { dataUriLimit = {} } = config.output || {};

  if (typeof dataUriLimit === 'number') {
    return dataUriLimit;
  }

  switch (type) {
    case 'svg':
      return dataUriLimit.svg ?? DEFAULT_DATA_URL_SIZE;
    case 'font':
      return dataUriLimit.font ?? DEFAULT_DATA_URL_SIZE;
    case 'media':
      return dataUriLimit.media ?? DEFAULT_DATA_URL_SIZE;
    case 'image':
      return dataUriLimit.image ?? DEFAULT_DATA_URL_SIZE;
    default:
      throw new Error(`unknown key ${type} in "output.dataUriLimit"`);
  }
};

export function getDataUrlCondition(
  config: BuilderConfig,
  type: keyof DataUriLimit,
) {
  return (source: Buffer, { filename }: { filename: string }): boolean => {
    const queryString = filename.split('?')[1];

    if (queryString) {
      const params = new URLSearchParams(queryString);

      // If a request has query like "foo.png?__inline=false" or "foo.png?url",
      // no matter how small the file is, it will still be treated as a resource instead of being inlined
      const url = params.get('url');
      const legacyInline = params.get('__inline');
      if (legacyInline === 'false' || url !== null) {
        return false;
      }

      // If a request has query like "foo?inline" or "foo?__inline", no matter how big the file is,
      // it will be inlined instead of treated as a resource
      const inline = params.get('inline');
      if (inline !== null || legacyInline !== null) {
        return true;
      }
    }

    return source.length <= getDataUrlLimit(config, type);
  };
}

export function applyDefaultBuilderOptions(
  options?: BuilderOptions,
): Required<BuilderOptions> {
  const DEFAULT_OPTIONS: Required<BuilderOptions> = {
    cwd: process.cwd(),
    entry: {},
    target: ['web'],
    configPath: null,
    builderConfig: {},
    framework: 'modern-js',
  };

  return {
    ...DEFAULT_OPTIONS,
    ...options,
  };
}

export function deepFreezed<T extends Record<any, any> | any[]>(obj: T): T {
  assert(typeof obj === 'object');
  const handle = (item: any) =>
    typeof item === 'object' ? deepFreezed(item) : item;
  const ret = (
    Array.isArray(obj) ? _.map(obj, handle) : _.mapValues(obj, handle)
  ) as T;
  return Object.freeze(ret);
}

/**
 * Check if a file handled by specific loader.
 * @author yangxingyuan
 * @param {Configuration} config - The webpack config.
 * @param {string} loader - The name of loader.
 * @param {string}  testFile - The name of test file that will be handled by webpack.
 * @returns {boolean} The result of the match.
 */
export function matchLoader({
  config,
  loader,
  testFile,
}: {
  config: webpack.Configuration;
  loader: string;
  testFile: string;
}): boolean {
  if (!config.module?.rules) {
    return false;
  }
  return config.module.rules.some(rule => {
    if (
      typeof rule === 'object' &&
      rule.test &&
      rule.test instanceof RegExp &&
      rule.test.test(testFile)
    ) {
      return (
        Array.isArray(rule.use) &&
        rule.use.some(useOptions => {
          if (typeof useOptions === 'object' && useOptions !== null) {
            return useOptions.loader?.includes(loader);
          } else if (typeof useOptions === 'string') {
            return useOptions.includes(loader);
          }
          return false;
        })
      );
    }
    return false;
  });
}

export function getPackageNameFromModulePath(modulePath: string) {
  const handleModuleContext = modulePath?.match(MODULE_PATH_REGEX);

  if (!handleModuleContext) {
    return false;
  }

  const [, , scope, name] = handleModuleContext;
  const packageName = ['npm', (scope ?? '').replace('@', ''), name]
    .filter(Boolean)
    .join('.');

  return packageName;
}

export const mergeBuilderConfig = <T>(...configs: T[]): T =>
  _.mergeWith({}, ...configs, (target: unknown, source: unknown) => {
    const pair = [target, source];
    if (pair.some(_.isUndefined)) {
      // fallback to lodash default merge behavior
      return undefined;
    }
    if (pair.some(_.isArray)) {
      return [..._.castArray(target), ..._.castArray(source)];
    }
    // convert function to chained function
    if (pair.some(_.isFunction)) {
      return [target, source];
    }
    // fallback to lodash default merge behavior
    return undefined;
  });

export async function stringifyConfig(config: unknown, verbose?: boolean) {
  const { default: WebpackChain } = await import(
    '../../compiled/webpack-5-chain'
  );

  // webpackChain.toString can be used as a common stringify method
  const stringify = WebpackChain.toString as (
    config: unknown,
    options: { verbose?: boolean },
  ) => string;

  return stringify(config as any, { verbose });
}
