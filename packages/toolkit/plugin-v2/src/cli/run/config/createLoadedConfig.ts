import {
  chalk,
  getCommand,
  getNodeEnv,
  isPlainObject,
  logger,
} from '@modern-js/utils';
import { mergeWith } from '@modern-js/utils/lodash';
import type { LoadedConfig } from '../types';
import { getConfigFilePath, loadConfig } from './loadConfig';

/**
 * A modern config can export a function or an object
 * If it's a function, it will be called and return a config object
 */
async function getConfigObject<T>(config?: T) {
  if (typeof config === 'function') {
    return (await config({ env: getNodeEnv(), command: getCommand() })) || {};
  }
  return config || {};
}

/**
 * Assign the pkg config into the user config.
 */
export function assignPkgConfig<T>(userConfig: T, pkgConfig: T) {
  return mergeWith({}, userConfig, pkgConfig, (objValue, srcValue) => {
    // mergeWith can not merge object with symbol, but plugins object contains symbol,
    // so we need to handle it manually.
    if (objValue === undefined && isPlainObject(srcValue)) {
      return { ...srcValue };
    }
    // return undefined to use the default behavior of mergeWith
    return undefined;
  });
}

export async function createLoadedConfig<T>(
  appDirectory: string,
  configFilePath: string,
  packageJsonConfig?: string,
): Promise<LoadedConfig<T>> {
  const configFile = getConfigFilePath(appDirectory, configFilePath);

  const loaded = await loadConfig<T>(
    appDirectory,
    configFile,
    packageJsonConfig,
  );

  if (!loaded.config && !loaded.pkgConfig) {
    logger.warn(
      `Can not find any config file in the current project, please check if you have a correct config file.`,
    );
    logger.warn(`Current project path: ${chalk.yellow(appDirectory)}`);
  }

  const config = await getConfigObject(loaded.config);
  let mergedConfig = config;

  if (loaded.pkgConfig) {
    mergedConfig = assignPkgConfig(config, loaded?.pkgConfig);
  }

  return {
    packageName: loaded.packageName,
    config: mergedConfig,
    configFile: loaded.configFile,
    pkgConfig: loaded.pkgConfig,
  };
}
