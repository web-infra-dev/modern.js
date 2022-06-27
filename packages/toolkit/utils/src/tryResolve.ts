import { ensureArray } from './ensureArray';

/**
 * Try to resolve npm package entry file path.
 * @param name - Package name.
 * @param resolvePath - Path to resolve dependencies.
 * @returns Resolved file path.
 */
export const tryResolve = (name: string, resolvePath: string) => {
  let filePath = '';
  try {
    filePath = require.resolve(name, { paths: [resolvePath] });
    delete require.cache[filePath];
  } catch (err) {
    if ((err as any).code === 'MODULE_NOT_FOUND') {
      throw new Error(`Can not find module ${name}.`);
    }
    throw err;
  }
  return filePath;
};

/**
 * Try to resolve npm package, return true if package is installed.
 */
export const isPackageInstalled = (
  name: string,
  resolvePaths: string | string[],
) => {
  try {
    require.resolve(name, { paths: ensureArray(resolvePaths) });
    return true;
  } catch (err) {
    return false;
  }
};
