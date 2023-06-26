import path from 'path';
import pkgUp from '../../../compiled/pkg-up';
import { getArgv } from '../commands';
import { fs, minimist, semver } from '../../compiled';
import { createDebugger } from '../common';
import { ensureArray } from '../ensure';

const debug = createDebugger('judge-depExists');

/**
 * Check if the package name is in dependencies or devDependencies.
 *
 * @param appDirectory - Project root directory.
 * @param name - Package name.
 * @returns True if the name is in dependencies or devDependencies, false otherwise.
 */
export const isDepExists = (appDirectory: string, name: string): boolean => {
  const pkgPath = path.resolve(appDirectory, './package.json');
  if (!fs.existsSync(pkgPath)) {
    debug(`can't find package.json under: %s`, appDirectory);
    return false;
  }
  const json = require(pkgPath);

  const { dependencies = {}, devDependencies = {} } = json;

  return (
    dependencies.hasOwnProperty(name) || devDependencies.hasOwnProperty(name)
  );
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

/**
 * Check is api only project
 * 1. env --api-only
 * 2. exist ${apiDir}/ && not exist ${entryDir}/
 *
 * @param appDirectory
 * @param entryDir default 'src'
 * @param apiDir default 'api'
 * @returns boolean
 */
export const isApiOnly = async (
  appDirectory: string,
  entryDir?: string,
  apiDir?: string,
): Promise<boolean> => {
  const existApi = await fs.pathExists(
    apiDir ?? path.join(appDirectory, 'api'),
  );
  const existSrc = await fs.pathExists(
    path.join(appDirectory, entryDir ?? 'src'),
  );
  const options = minimist(getArgv());
  // env first
  if (options['api-only']) {
    return true;
  }
  // exist api/ && not exist ${entryDir}/
  return existApi && !existSrc;
};

export const isWebOnly = async () => {
  const options = minimist(getArgv());
  return Boolean(options['web-only']);
};

export const isBeyondReact17 = (cwd: string) => {
  const pkgPath = pkgUp.sync({ cwd });

  if (!pkgPath) {
    return false;
  }

  const pkgInfo = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  const deps = {
    ...pkgInfo.devDependencies,
    ...pkgInfo.dependencies,
  };

  if (typeof deps.react !== 'string') {
    return false;
  }

  return semver.satisfies(semver.minVersion(deps.react)!, '>=17.0.0');
};

export const isReact18 = (cwd: string) => {
  const pkgPath = path.join(cwd, 'package.json');

  if (!fs.existsSync(pkgPath)) {
    return false;
  }

  const pkgInfo = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  const deps = {
    ...pkgInfo.devDependencies,
    ...pkgInfo.dependencies,
  };

  if (typeof deps.react !== 'string') {
    return false;
  }

  return semver.satisfies(semver.minVersion(deps.react)!, '>=18.0.0');
};

/**
 * Is typescript project.
 *
 * @param root - App directory.
 * @returns Whether to use typescript.
 */
export const isTypescript = (root: string): boolean =>
  fs.existsSync(path.resolve(root, './tsconfig.json'));
