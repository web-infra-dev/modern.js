import betterAjvErrors from 'better-ajv-errors';
import ajvKeywords from 'ajv-keywords';
import { importLazy } from '../utils';
import { LibuildError } from '../error';
import { UserConfig } from '../types';
import { DEFAULT_SCHEMA } from './schema';
import { ErrorCode } from '../constants/error';

const Ajv: typeof import('ajv') = importLazy(() => require('ajv'));

export function validateUserConfig(config: UserConfig) {
  const ajv = new Ajv.default({
    allowUnionTypes: true,
  });

  // add custom json schema keywords from Ajv
  ajvKeywords(ajv);

  const schema = DEFAULT_SCHEMA;

  const validate = ajv.compile(schema);

  const valid = validate(config);

  if (!valid && validate.errors?.length) {
    // get better output of validate result
    const validateOutput = betterAjvErrors(schema, config, validate.errors, {
      format: 'cli',
      indent: 2,
    });

    throw new LibuildError(ErrorCode.VALIDATE_CONFIG_FAILED, `${validateOutput}\n\n`);
  }
}
