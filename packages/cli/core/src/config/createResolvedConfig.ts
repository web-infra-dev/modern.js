import { createDebugger, logger } from '@modern-js/utils';
import { patchSchema } from '../schema/patchSchema';
import type {
  UserConfig,
  NormalizedConfig,
  LoadedConfig,
  PluginValidateSchema,
} from '../types';
import { repeatKeyWarning } from '../utils/repeatKeyWarning';
import { mergeConfig } from '../utils/mergeConfig';
import { createDefaultConfig } from './createDefaultConfig';

const debug = createDebugger('resolve-config');

export const createResolveConfig = async (
  // eslint-disable-next-line @typescript-eslint/ban-types
  loaded: LoadedConfig<{}>,
  configs: UserConfig[],
  schemas: PluginValidateSchema[],
): Promise<NormalizedConfig> => {
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
  const valid = validate(userConfig);

  const formatValidateError = (config: UserConfig) =>
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

  if (!valid && validate.errors?.length) {
    const errors = formatValidateError(userConfig);
    logger.log(errors);
    throw new Error(`Validate configuration error`);
  }

  // validate config from plugins.
  for (const config of configs) {
    if (!validate(config)) {
      const errors = formatValidateError(config);
      logger.error(errors);
      throw new Error(`Validate configuration error.`);
    }
  }

  const resolved = mergeConfig([createDefaultConfig(), ...configs, userConfig]);

  debug('resolved %o', resolved);

  return resolved;
};
