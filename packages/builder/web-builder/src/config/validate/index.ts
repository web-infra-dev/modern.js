import Ajv, { JSONSchemaType, ValidateFunction } from 'ajv';
import sourceField from './source';
import type { BuilderConfig } from '../../types';

export const configSchema: JSONSchemaType<BuilderConfig> = {
  type: 'object',
  properties: {
    source: sourceField,
    dev: {} as any,
    experiments: {} as any,
    output: {} as any,
    performance: {} as any,
    security: {} as any,
    tools: {} as any,
  },
};

export class ConfigValidator {
  static async create(cachePath?: string): Promise<ConfigValidator> {
    // deserialize pre-compiled validate function.
    if (typeof cachePath === 'string') {
      try {
        // TODO: try to deserialize pre-compiled validate function.
        return {} as any;
      } catch (error) {
        // TODO: only log when enable debug mode.
        console.warn(
          'Failed to deserialize pre-compiled validate function:\n',
          error,
        );
      }
    }
    // fallback to compile validator in runtime.
    const validator = new ConfigValidator();
    const ajv = new Ajv();
    validator.ajv = ajv;
    validator.compiled = await ajv.compileAsync(configSchema);
    return validator;
  }

  public errors?: ConfigValidator['compiled']['errors'];

  private ajv!: Ajv;

  private compiled!: ValidateFunction<BuilderConfig>;

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  protected constructor() {}

  get errorMsg(): string | void {
    return this.compiled.errors
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
