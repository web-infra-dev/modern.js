import fs from 'fs';
import path from 'path';
import { findExists, createDebugger } from '@modern-js/utils';
import { bundleRequire } from '@modern-js/node-bundle-require';

const debug = createDebugger('load-config');

export const CONFIG_FILE_NAME = 'modern.config';

export const CONFIG_FILE_EXTENSIONS = ['.js', '.ts', '.ejs', '.mjs'];

export const PACKAGE_JSON_CONFIG_NAME = 'modernConfig';

/**
 * Get user config from package.json.
 * @param appDirectory - App root directory.
 * @returns modernConfig or undefined
 */
export const getPackageConfig = <T>(appDirectory: string) => {
  const json = JSON.parse(
    fs.readFileSync(path.resolve(appDirectory, './package.json'), 'utf8'),
  );

  return json[PACKAGE_JSON_CONFIG_NAME] as T | undefined;
};

/**
 * Get the file dependencies by module.children, ignore file path in node_modules and this monorepo packages default.
 * @param filePath - Absolute file path.
 * @returns File dependencies array.
 */
export const getDependencies = (filePath: string): string[] => {
  const mod: NodeModule | undefined = require.cache[filePath];

  if (!mod) {
    debug(`${filePath} has not been required yet`);
    return [];
  }

  const deps: string[] = [];

  if (!/\/node_modules\/|\/modern-js\/packages\//.test(mod.id)) {
    deps.push(mod.id);
    for (const child of mod.children) {
      deps.push(...getDependencies(child.id));
    }
  }

  return deps;
};

const bundleRequireWithCatch = async (configFile: string): Promise<any> => {
  try {
    const mod = await bundleRequire(configFile);

    return mod;
  } catch (e) {
    if (e instanceof Error) {
      e.message = `Get Error while loading config file: ${configFile}, please check it and retry.\n${
        e.message || ''
      }`;
    }
    throw e;
  }
};

/**
 * Parse and load user config file, support extnesions like .ts, mjs, js, ejs.
 * @param appDirectory - App root directory, from which start search user config file.
 * @param filePath - Specific absolute config file path.
 * @returns Object contain config file path, user config object and dependency files used by config file.
 */
export const loadConfig = async <T>(
  appDirectory: string,
  filePath?: string,
): Promise<{
  path: string | false;
  config?: T;
  dependencies?: string[];
  pkgConfig?: T;
}> => {
  const configFile = filePath
    ? filePath
    : findExists(
        CONFIG_FILE_EXTENSIONS.map(extension =>
          path.resolve(appDirectory, `${CONFIG_FILE_NAME}${extension}`),
        ),
      );

  const pkgConfig = getPackageConfig<T>(appDirectory);

  let config: T | undefined;

  const dependencies = pkgConfig
    ? [path.resolve(appDirectory, './package.json')]
    : [];

  if (configFile) {
    delete require.cache[configFile];

    const mod = await bundleRequireWithCatch(configFile);

    config = mod.default || mod;

    // TODO: get deps.
    // dependencies = dependencies.concat(getDependencies(configFile));
  }

  return {
    path: configFile,
    config,
    pkgConfig,
    dependencies,
  };
};
