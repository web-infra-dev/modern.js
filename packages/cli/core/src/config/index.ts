import {
  signale as logger,
  createDebugger,
  getPort,
  isDev,
  PLUGIN_SCHEMAS,
  chalk,
  isPlainObject,
  getServerConfig,
  getPackageManager,
} from '@modern-js/utils';
import { mergeWith } from '@modern-js/utils/lodash';
import { loadConfig } from '../load-configs';

import Ajv, { ErrorObject } from '../../compiled/ajv';
import ajvKeywords from '../../compiled/ajv-keywords';
import betterAjvErrors from '../../compiled/better-ajv-errors';
import { repeatKeyWarning } from '../utils/repeatKeyWarning';
import { defaults } from './defaults';
import { mergeConfig, NormalizedConfig } from './mergeConfig';
import { patchSchema, PluginValidateSchema } from './schema';
import type { UserConfig, ConfigParam, LoadedConfig } from './types';

const debug = createDebugger('resolve-config');

export { defaults as defaultsConfig };
export * from './mergeConfig';
export * from './types';
export * from './schema';

export const addServerConfigToDeps = async (
  dependencies: string[],
  appDirectory: string,
  serverConfigFile: string,
) => {
  const serverConfig = await getServerConfig(appDirectory, serverConfigFile);
  if (serverConfig) {
    dependencies.push(serverConfig);
  }
};

export const defineConfig = (config: ConfigParam): ConfigParam => config;

/**
 * Assign the pkg config into the user config.
 */
export const assignPkgConfig = (
  userConfig: UserConfig = {},
  pkgConfig: ConfigParam = {},
) =>
  mergeWith({}, userConfig, pkgConfig, (objValue, srcValue) => {
    // mergeWith can not merge object with symbol, but plugins object contains symbol,
    // so we need to handle it manually.
    if (objValue === undefined && isPlainObject(srcValue)) {
      return { ...srcValue };
    }
    // return undefined to use the default behavior of mergeWith
    return undefined;
  });

export const loadUserConfig = async (
  appDirectory: string,
  filePath?: string,
  packageJsonConfig?: string,
): Promise<LoadedConfig> => {
  const loaded = await loadConfig<ConfigParam>(
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
    jsConfig: config || {},
    pkgConfig: (loaded?.pkgConfig || {}) as UserConfig,
    filePath: loaded?.path,
    dependencies: loaded?.dependencies || [],
  };
};

const showAdditionalPropertiesError = async (error: ErrorObject) => {
  if (
    error.keyword === 'additionalProperties' &&
    error.params.additionalProperty
  ) {
    const target = [
      error.instancePath.slice(1),
      error.params.additionalProperty,
    ]
      .filter(Boolean)
      .join('.');

    const name = Object.keys(PLUGIN_SCHEMAS).find(key =>
      (PLUGIN_SCHEMAS as Record<string, any>)[key].some(
        (schemaItem: any) => schemaItem.target === target,
      ),
    );

    if (name) {
      const packageManager = await getPackageManager();
      logger.warn(
        `The configuration of ${chalk.bold(
          target,
        )} is provided by plugin ${chalk.bold(name)}. Please use ${chalk.bold(
          `${packageManager} run new`,
        )} to enable the corresponding capability.\n`,
      );
    }
  }
};

export const resolveConfig = async (
  loaded: LoadedConfig,
  configs: UserConfig[],
  schemas: PluginValidateSchema[],
  restartWithExistingPort: number,
  argv: string[],
  onSchemaError: (
    error: ErrorObject,
  ) => void | Promise<void> = showAdditionalPropertiesError,
): Promise<NormalizedConfig> => {
  const { config: userConfig, jsConfig, pkgConfig } = loaded;

  const ajv = new Ajv({ $data: true, strict: false });

  ajvKeywords(ajv);

  const validateSchema = patchSchema(schemas);

  const validate = ajv.compile(validateSchema);

  repeatKeyWarning(validateSchema, jsConfig, pkgConfig);

  // validate user config.
  const valid = validate(userConfig);

  if (!valid && validate.errors?.length) {
    await onSchemaError(validate?.errors[0]);

    const errors = betterAjvErrors(
      validateSchema,
      userConfig,
      validate.errors?.map(e => ({
        ...e,
        dataPath: e.instancePath,
      })),
      {
        indent: 2,
      },
    );

    logger.log(errors);
    throw new Error(`Validate configuration error`);
  }

  // validate config from plugins.
  for (const config of configs) {
    if (!validate(config)) {
      logger.error(validate.errors);
      throw new Error(`Validate configuration error.`);
    }
  }
  const resolved = mergeConfig([defaults, ...configs, userConfig]);

  resolved._raw = loaded.config;

  if (isDev() && argv[0] === 'dev') {
    if (restartWithExistingPort > 0) {
      // dev server is restarted, should use existing port number
      resolved.server.port = restartWithExistingPort;
    } else {
      // get port for new dev server
      resolved.server.port = await getPort(resolved.server.port!);
    }
  }

  debug('resolved %o', resolved);

  return resolved;
};
