import { ConfigValidator } from './validate';
import { normalizeConfig } from './normalize';
import { BuilderConfig, NormalizedConfig } from '../types';

export interface ProcessConfigOptions {
  validate?: boolean;
}

export const processConfig = async (
  config: BuilderConfig,
  options?: ProcessConfigOptions,
): Promise<NormalizedConfig> => {
  if (options?.validate !== false) {
    const validator = await ConfigValidator.create();
    await validator.validate(config, false);
  }
  return normalizeConfig(config);
};
