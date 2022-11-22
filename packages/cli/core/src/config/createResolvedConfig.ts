import {
  createDebugger,
  logger,
  getPackageManager,
  chalk,
} from '@modern-js/utils';
import type { ErrorObject } from '@modern-js/utils/ajv';
import { PLUGIN_SCHEMAS } from '@modern-js/utils/constants';
import { patchSchema } from '../schema/patchSchema';
import type {
  CliUserConfig,
  CliNormalizedConfig,
  LoadedConfig,
  PluginValidateSchema,
} from '../types';
import { repeatKeyWarning } from '../utils/repeatKeyWarning';
import { mergeConfig } from '../utils/mergeConfig';

const debug = createDebugger('resolve-config');

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

export const createResolveConfig = async (
  // eslint-disable-next-line @typescript-eslint/ban-types
  loaded: LoadedConfig<{}>,
  configs: CliUserConfig[],
  schemas: PluginValidateSchema[],
  _onSchemaError: (
    error: ErrorObject,
  ) => void | Promise<void> = showAdditionalPropertiesError,
): Promise<CliNormalizedConfig> => {
  const { default: Ajv } = await import('@modern-js/utils/ajv');
  const { default: ajvKeywords } = await import(
    '@modern-js/utils/ajv-keywords'
  );
  const { default: betterAjvErrors } = await import(
    '@modern-js/utils/better-ajv-errors'
  );

  const { config: userConfig, jsConfig, pkgConfig } = loaded;

  const ajv = new Ajv({ $data: true, strict: false });

  ajvKeywords(ajv);

  const validateSchema = patchSchema(schemas);
  const validate = ajv.compile(validateSchema);

  repeatKeyWarning(validateSchema, jsConfig, pkgConfig);

  // validate user config.
  // const valid = validate(userConfig);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _formatValidateError = (config: CliUserConfig) =>
    betterAjvErrors(
      validateSchema,
      config,
      validate.errors?.map(e => ({
        ...e,
        dataPath: e.instancePath,
      })),
      {
        indent: 2,
      },
    );

  // FIXME: pass temporarily
  // if (!valid && validate.errors?.length) {
  //   await onSchemaError(validate?.errors[0]);
  //   const errors = formatValidateError(userConfig);
  //   logger.log(errors);
  //   throw new Error(`Validate configuration error`);
  // }

  // validate config from plugins.
  // for (const config of configs) {
  //   if (!validate(config)) {
  //     const errors = formatValidateError(config);
  //     logger.error(errors);
  //     throw new Error(`Validate configuration error.`);
  //   }
  // }

  const resolved = mergeConfig([...configs, userConfig]);

  debug('resolved %o', resolved);

  return resolved;
};
