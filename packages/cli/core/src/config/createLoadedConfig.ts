import { mergeWith } from '@modern-js/utils/lodash';
import { isPlainObject } from '@modern-js/utils';
import { LoadedConfig, CliUserConfig, ConfigParams } from '../types';
import { loadConfig } from '../load-configs';

/**
 * Assign the pkg config into the user config.
 */
export const assignPkgConfig = (
  userConfig: CliUserConfig = {},
  pkgConfig: ConfigParams = {},
): CliUserConfig =>
  mergeWith({}, userConfig, pkgConfig, (objValue, srcValue) => {
    // mergeWith can not merge object with symbol, but plugins object contains symbol,
    // so we need to handle it manually.
    if (objValue === undefined && isPlainObject(srcValue)) {
      return { ...srcValue };
    }
    // return undefined to use the default behavior of mergeWith
    return undefined;
  });

export async function createLoadedConfig(
  appDirectory: string,
  filePath?: string,
  packageJsonConfig?: string,
  // eslint-disable-next-line @typescript-eslint/ban-types
): Promise<LoadedConfig<{}>> {
  const loaded = await loadConfig<ConfigParams>(
    appDirectory,
    filePath,
    packageJsonConfig,
  );

  const config = !loaded
    ? {}
    : await (typeof loaded.config === 'function'
        ? loaded.config(0)
        : loaded.config);

  return {
    config: assignPkgConfig(config, loaded?.pkgConfig),
    filePath: loaded.path,
    dependencies: loaded.dependencies || [],
    pkgConfig: loaded.pkgConfig || {},
    jsConfig: config || {},
  };
}
