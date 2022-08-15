import path from 'path';
import sourceField from './source';
import { promises as fs } from 'fs';

import type { BuilderConfig } from '../../../types';
import type Ajv from '@modern-js/utils/ajv';
import type { JSONSchemaType, ValidateFunction } from '@modern-js/utils/ajv';

export const configSchema: JSONSchemaType<BuilderConfig> = {
  type: 'object',
  properties: {
    source: sourceField,
    dev: { type: 'object' } as any,
    experiments: { type: 'object' } as any,
    output: { type: 'object' } as any,
    performance: { type: 'object' } as any,
    security: { type: 'object' } as any,
    tools: { type: 'object' } as any,
  },
};

export class ConfigValidator {
  static async create(cachePath?: string): Promise<ConfigValidator> {
    // import pre-compiled validate function.
    if (typeof cachePath === 'string') {
      try {
        return await this.deserialize(cachePath);
      } catch (e) {}
    }
    // fallback to compile validator in runtime.
    const { default: Ajv } = await import('@modern-js/utils/ajv');
    const validator = new ConfigValidator();
    const ajv = new Ajv();
    validator.ajv = ajv;
    validator.compiled = ajv.compile(configSchema);
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
      await fs.mkdir(path.dirname(cachePath), { recursive: true });
      await fs.writeFile(cachePath, code);
    }
    return code;
  }

  public errors?: ConfigValidator['compiled']['errors'];

  private ajv?: Ajv;

  private compiled!: ValidateFunction<BuilderConfig>;

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  protected constructor() {}

  get errorMsg(): string | void {
    return this.compiled.errors && this.ajv
      ? this.ajv.errorsText(this.compiled.errors)
      : undefined;
  }

  async validate(config: BuilderConfig, silent = true): Promise<boolean> {
    const valid = this.compiled(config);
    if (!valid && !silent) {
      throw new Error(this.errorMsg || 'Failed to validate config.');
    } else {
      return valid;
    }
  }
}
