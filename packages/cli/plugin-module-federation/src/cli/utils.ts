import path from 'node:path';
import type { Rspack } from '@rsbuild/core';

export type ConfigType = Rspack.Configuration;

export const isWebTarget = (target: unknown) => {
  const WEB_TARGET = 'web';
  if (Array.isArray(target)) {
    return target.includes(WEB_TARGET);
  } else if (typeof target === 'string') {
    return target === WEB_TARGET;
  }
  return false;
};

export const skipByTarget = (target: unknown) => {
  const IGNORE_TARGET = 'webworker';
  if (Array.isArray(target)) {
    return target.includes(IGNORE_TARGET) || target.includes('web-worker');
  } else if (typeof target === 'string') {
    return target === IGNORE_TARGET || target === 'web-worker';
  }
  return false;
};

export function isDev() {
  return process.env.NODE_ENV === 'development';
}

// Node ESM and CJS artifacts have different extensions. Resolve relative to
// this package rather than the application's dependency tree.
export function resolveInternalPlugin(relativePath: string): string {
  const extension = process.env.MODERN_LIB_FORMAT === 'esm' ? '.mjs' : '.js';
  return require.resolve(path.resolve(__dirname, relativePath + extension));
}
