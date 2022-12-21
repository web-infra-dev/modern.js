import { promises as fs } from 'fs';
import path from 'path';
import { configSchema } from './schema';

import type Ajv from '@modern-js/utils/ajv';
import type { ValidateFunction } from '@modern-js/utils/ajv';
import type { SomeJSONSchema } from '@modern-js/utils/ajv/json-schema';
import _ from '@modern-js/utils/lodash';

export { configSchema };

export interface ConfigValidatorOptions {
  cachePath?: string;
  schema?: SomeJSONSchema;
}

export class ConfigValidator {
  static async create(
    options?: ConfigValidatorOptions,
  ): Promise<ConfigValidator> {
    const opt = _.assign({ schema: configSchema }, options);

    // import pre-compiled validate function.
    if (typeof opt.cachePath === 'string') {
      try {
        return await this.deserialize(opt.cachePath);
      } catch (e) {}
    }
    // fallback to compile validator in runtime.
    const { default: Ajv } = await import('@modern-js/utils/ajv');
    const { default: ajvKeywords } = await import(
      '@modern-js/utils/ajv-keywords'
    );
    const validator = new ConfigValidator();
    const ajv = new Ajv({
      $data: true,
      strict: false,
    });
    ajvKeywords(ajv);
    validator.ajv = ajv;
    validator.compiled = ajv.compile(opt.schema);
    return validator;
  }

  static async deserialize(
    cached: string | ConfigValidator['compiled'],
  ): Promise<ConfigValidator> {
    const compiledValidate =
      typeof cached === 'string'
        ? (await import(path.resolve(cached))).default
        : cached;
    if (typeof compiledValidate !== 'function') {
      throw new Error('Failed to deserialize pre-compiled validate function.');
    }
    const validator = new ConfigValidator();
    validator.compiled = compiledValidate;
    return validator;
  }

  static async serialize(
    validator: ConfigValidator,
    cachePath?: string,
  ): Promise<string> {
    if (!validator.compiled) {
      throw new Error('Failed to serialize validator.');
    }
    const code = `module.exports = ${validator.compiled.toString()};`;
    if (typeof cachePath === 'string') {
      await fs
        .mkdir(path.dirname(cachePath), { recursive: true })
        .catch(console.warn);
      await fs.writeFile(cachePath, code);
    }
    return code;
  }

  public errors?: ConfigValidator['compiled']['errors'];

  private ajv?: Ajv;

  private compiled!: ValidateFunction<unknown>;

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  protected constructor() {}

  get errorMsg(): string | void {
    return this.compiled.errors && this.ajv
      ? this.ajv.errorsText(this.compiled.errors)
      : undefined;
  }

  async validate(config: any, silent = true): Promise<boolean> {
    const valid = this.compiled(config);
    if (!valid && !silent) {
      const { default: betterAjvErrors } = await import(
        '@modern-js/utils/better-ajv-errors'
      );

      throw new Error(
        betterAjvErrors(
          configSchema,
          config,
          this.compiled.errors?.map(e => ({
            ...e,
            dataPath: e.instancePath,
          })),
          {
            indent: 2,
          },
        ),
      );
    } else {
      return valid;
    }
  }
}
