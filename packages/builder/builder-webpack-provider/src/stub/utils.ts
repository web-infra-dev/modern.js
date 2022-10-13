import fs, { PathLike } from 'fs';
import type { GlobbyOptions } from '@modern-js/utils';
import type webpack from 'webpack';

export interface GlobContentJSONOptions extends GlobbyOptions {
  maxSize?: number;
}

export const globContentJSON = async (
  paths: string | string[],
  options?: GlobContentJSONOptions,
) => {
  const { globby, fs } = await import('@modern-js/utils');
  const files = await globby(paths, options);
  let totalSize = 0;
  const maxSize = 1024 * (options?.maxSize ?? 4096);
  const ret: Record<string, string> = {};
  for await (const file of files) {
    const { size } = await fs.stat(file);
    totalSize += size;
    if (maxSize && totalSize > maxSize) {
      throw new Error('too large');
    }
    ret[file] = await fs.readFile(file, 'utf-8');
  }
  return ret;
};

export const filenameToGlobExpr = (file: PathLike) =>
  fs.statSync(file).isDirectory() ? `${file}/**/*` : file;

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
