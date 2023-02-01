import path from 'path';
import { mergeWith } from '@modern-js/utils/lodash';
import {
  fs,
  findExists,
  isDevCommand,
  isPlainObject,
  CONFIG_FILE_EXTENSIONS,
} from '@modern-js/utils';
import { LoadedConfig, UserConfig, ConfigParams } from '../types';
import {
  loadConfig,
  getConfigFilePath,
  LOCAL_CONFIG_FILE_NAME,
} from '../load-configs';
import { mergeConfig } from '../utils';

/**
 * Assign the pkg config into the user config.
 */
export const assignPkgConfig = (
  userConfig: UserConfig = {},
  pkgConfig: ConfigParams = {},
): UserConfig =>
  mergeWith({}, userConfig, pkgConfig, (objValue, srcValue) => {
    // mergeWith can not merge object with symbol, but plugins object contains symbol,
    // so we need to handle it manually.
    if (objValue === undefined && isPlainObject(srcValue)) {
      return { ...srcValue };
    }
    // return undefined to use the default behavior of mergeWith
    return undefined;
  });

/**
 * A modern config can export a function or an object
 * If it's a function, it will be called and return a config object
 */
async function getConfigObject(config?: ConfigParams) {
  if (typeof config === 'function') {
    return (await config(0)) || {};
  }
  return config || {};
}

async function loadLocalConfig(
  appDirectory: string,
  configFile: string | false,
) {
  let localConfigFile: string | false = false;

  if (typeof configFile === 'string') {
    for (const ext of CONFIG_FILE_EXTENSIONS) {
      if (configFile.endsWith(ext)) {
        const replacedPath = configFile.replace(ext, `.local${ext}`);
        if (fs.existsSync(replacedPath)) {
          localConfigFile = replacedPath;
        }
      }
    }
  } else {
    localConfigFile = findExists(
      CONFIG_FILE_EXTENSIONS.map(extension =>
        path.resolve(appDirectory, `${LOCAL_CONFIG_FILE_NAME}${extension}`),
      ),
    );
  }

  if (localConfigFile) {
    const loaded = await loadConfig<ConfigParams>(
      appDirectory,
      localConfigFile,
    );
    return getConfigObject(loaded.config);
  }

  return null;
}

export async function createLoadedConfig(
  appDirectory: string,
  filePath?: string,
  packageJsonConfig?: string,
  // eslint-disable-next-line @typescript-eslint/ban-types
): Promise<LoadedConfig<{}>> {
  const configFile = getConfigFilePath(appDirectory, filePath);

  const loaded = await loadConfig<ConfigParams>(
    appDirectory,
    configFile,
    packageJsonConfig,
  );

  const config = await getConfigObject(loaded.config);
  let mergedConfig = config;

  if (loaded.pkgConfig) {
    mergedConfig = assignPkgConfig(config, loaded?.pkgConfig);
  }

  // Only load local config when running dev command
  if (isDevCommand()) {
    const localConfig = await loadLocalConfig(appDirectory, configFile);

    // The priority of local config is higher than the user config and pkg config
    if (localConfig) {
      mergedConfig = mergeConfig([mergedConfig, localConfig]);
    }
  }

  return {
    config: mergedConfig,
    filePath: loaded.path,
    dependencies: loaded.dependencies || [],
    pkgConfig: loaded.pkgConfig || {},
    jsConfig: config || {},
  };
}
