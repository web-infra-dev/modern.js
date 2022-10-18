import { promises as fs } from 'fs';
import path from 'path';
import sourceField from './source';

import type Ajv from '@modern-js/utils/ajv';
import type { JSONSchemaType, ValidateFunction } from '@modern-js/utils/ajv';
import type { SomeJSONSchema } from '@modern-js/utils/ajv/json-schema';
import _ from '@modern-js/utils/lodash';
import type { BuilderConfig } from '../../types';

export const configSchema: JSONSchemaType<BuilderConfig> = {
  type: 'object',
  properties: {
    source: sourceField as any,
    dev: { type: 'object' } as any,
    html: { type: 'object' } as any,
    experiments: { type: 'object' } as any,
    output: { type: 'object' } as any,
    // performance: { type: 'object' } as any,
    // security: { type: 'object' } as any,
    tools: { type: 'object' } as any,
  },
  required: [],
};

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
    const validator = new ConfigValidator();
    const ajv = new Ajv({
      allowUnionTypes: true,
      useDefaults: true,
      strict: true,
      removeAdditional: true,
    });
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
      throw new Error(this.errorMsg || 'Failed to validate config.');
    } else {
      return valid;
    }
  }
}
