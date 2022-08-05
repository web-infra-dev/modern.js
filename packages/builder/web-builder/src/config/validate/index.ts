import Ajv, { JSONSchemaType, ValidateFunction } from 'ajv';
import { BuilderConfig } from 'src/types';
import sourceField from './source';

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
  static async create(): Promise<ConfigValidator> {
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
