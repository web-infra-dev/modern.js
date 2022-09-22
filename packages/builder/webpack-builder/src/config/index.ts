import { ConfigValidator } from './validate';
import { normalizeConfig } from './normalize';
import { BuilderConfig, FinalConfig } from '../types';

export interface ProcessConfigOptions {
  validate?: boolean;
}

export const processConfig = async (
  config: BuilderConfig,
  options?: ProcessConfigOptions,
): Promise<FinalConfig> => {
  if (options?.validate !== false) {
    const validator = await ConfigValidator.create();
    await validator.validate(config, false);
  }
  return normalizeConfig(config);
};
