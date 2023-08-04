import { deepMerge } from '@modern-js/libuild-utils';
import path from 'path';
import * as fs from 'fs';
import { warpErrors, ConfigLoaderMesaageToLibuildError, LibuildError } from '../error';
import { CLIConfig, UserConfig } from '../types';
import { DEFAULT_CONFIG_FILE_NAME } from '../constants/config';
import { ErrorCode } from '../constants/error';
import type { IConfigLoaderOptions, IConfigLoaderResult } from '../types';
import { getRequireResult, parseError, getTransformWarnings, register } from '../utils';

function getDefaultConfigFilePath(root: string, configFile?: string) {
  return path.resolve(root, configFile || DEFAULT_CONFIG_FILE_NAME);
}

export async function loadConfig(config: CLIConfig): Promise<CLIConfig | CLIConfig[]> {
  const root = config.root ?? process.cwd();
  const configFilePath = getDefaultConfigFilePath(root, config.configFile);
  const loadedConfig = await loadRawConfig<UserConfig | UserConfig[]>({
    configKey: 'libuild',
    configFile: configFilePath,
    cwd: root,
  });

  const errorData = warpErrors(
    (loadedConfig.errors ?? [])
      .map((data) => ConfigLoaderMesaageToLibuildError(data, true))
      .concat((loadedConfig.warnings ?? []).map((data) => ConfigLoaderMesaageToLibuildError(data, false))),
    'warning'
  );

  // when the configuration file is specified and can't find
  if (config.configFile && !loadedConfig.path) {
    errorData.errors.push(new LibuildError(ErrorCode.CONFIG_NOT_EXIT, `${configFilePath} is not exists in ${root}`));
  }

  if (errorData.errors.length > 0) {
    throw errorData;
  }

  if (loadedConfig.warnings?.length) {
    console.warn(errorData.warnings.join('\n\n'));
  }

  const { data: userConfig } = loadedConfig;

  if (Array.isArray(userConfig)) {
    return userConfig.map((c) => deepMerge(c, config));
  }

  return deepMerge(userConfig, config);
}

export async function loadRawConfig<T = Record<string, unknown>>(
  opts: IConfigLoaderOptions
): Promise<IConfigLoaderResult<T>> {
  const { cwd = process.cwd(), configKey, configFile, configSuffix = 'config', transformOptions = {} } = opts;
  const files = Array.isArray(configFile)
    ? configFile
    : typeof configFile === 'string'
    ? [configFile]
    : [
        `${configKey}.${configSuffix}.ts`,
        `${configKey}.${configSuffix}.js`,
        `.${configKey}rc.ts`,
        `.${configKey}rc.js`,
      ];

  const filepath = files.map((i) => path.resolve(cwd, i)).find((i) => fs.existsSync(i));

  if (!filepath) {
    return {
      path: undefined,
      data: {} as T,
      errors: [],
      warnings: [],
    };
  }

  // register esbuild
  const { unregister } = register(transformOptions);

  let data: any;
  let error: Error | undefined;

  try {
    data = getRequireResult(require(filepath as string));
  } catch (err: any) {
    error = err;
  }

  const errors = error ? await parseError(error) : [];
  const warnings = await getTransformWarnings();

  unregister();

  return {
    path: filepath,
    data,
    errors,
    warnings,
  };
}
