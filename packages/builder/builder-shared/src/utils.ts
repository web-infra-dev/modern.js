import {
  CSS_MODULES_REGEX,
  GLOBAL_CSS_REGEX,
  NODE_MODULES_REGEX,
} from './constants';
import type {
  SharedNormalizedConfig,
  BuilderTarget,
  SharedCompiledPkgNames,
  CssModules,
} from './types';
import { join } from 'path';

export const extendsType =
  <T>() =>
  <P extends T>(source: P): P =>
    source;

export const createVirtualModule = (content: string) =>
  `data:text/javascript,${content}`;

export const removeLeadingSlash = (s: string): string => s.replace(/^\/+/, '');

export const addTrailingSlash = (s: string): string =>
  s.endsWith('/') ? s : `${s}/`;

/** Determine if a file path is a CSS module when disableCssModuleExtension is enabled. */
export const isLooseCssModules = (path: string) => {
  if (NODE_MODULES_REGEX.test(path)) {
    return CSS_MODULES_REGEX.test(path);
  }
  return !GLOBAL_CSS_REGEX.test(path);
};

export interface AwaitableGetter<T> extends PromiseLike<T[]> {
  promises: Promise<T>[];
}

/**
 * Make Awaitable.
 */
export const awaitableGetter = <T>(
  promises: Promise<T>[],
): AwaitableGetter<T> => {
  const then: PromiseLike<T[]>['then'] = (...args) =>
    Promise.all(promises).then(...args);
  return { then, promises };
};

export const isUseJsSourceMap = (config: SharedNormalizedConfig) => {
  const { disableSourceMap } = config.output || {};

  if (typeof disableSourceMap === 'boolean') {
    return !disableSourceMap;
  }

  return !disableSourceMap.js;
};

export const isUseCssSourceMap = (config: SharedNormalizedConfig) => {
  const { disableSourceMap } = config.output || {};

  if (typeof disableSourceMap === 'boolean') {
    return !disableSourceMap;
  }

  // If the disableSourceMap.css option is not specified, we will enable it in development mode.
  // We do not need CSS Source Map in production mode.
  if (disableSourceMap.css === undefined) {
    return process.env.NODE_ENV !== 'production';
  }

  return !disableSourceMap.css;
};

export const getSharedPkgCompiledPath = (
  packageName: SharedCompiledPkgNames,
) => {
  return join(__dirname, '../compiled', packageName);
};

// Determine if the string is a URL
export const isURL = (str: string) =>
  str.startsWith('http') || str.startsWith('//:');

export * as z from './zod';

export function isWebTarget(target: BuilderTarget | BuilderTarget[]): boolean {
  return ['modern-web', 'web'].some(t =>
    (Array.isArray(target) ? target : [target]).includes(t as BuilderTarget),
  );
}

export type CssLoaderModules =
  | boolean
  | string
  | {
      auto: boolean | ((filename: string) => boolean);
    };

export const isCssModules = (filename: string, modules: CssLoaderModules) => {
  if (typeof modules === 'boolean') {
    return modules;
  }

  // todo: this configuration is not common and more complex.
  if (typeof modules === 'string') {
    return true;
  }

  const { auto } = modules;

  if (typeof auto === 'boolean') {
    return auto && CSS_MODULES_REGEX.test(filename);
  } else if (typeof auto === 'function') {
    return auto(filename);
  }
  return true;
};

export const getCssModulesAutoRule = (
  config?: CssModules,
  disableCssModuleExtension = false,
) => {
  if (!config || config?.auto === undefined) {
    return disableCssModuleExtension ? isLooseCssModules : true;
  }

  return config.auto;
};
