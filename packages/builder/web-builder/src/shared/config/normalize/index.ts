import type { BuilderConfig, BuilderFinalConfig } from '../../../types';
import normalizeSourceConfig from './source';

export const normalizeConfig = async (
  config: BuilderConfig,
): Promise<BuilderFinalConfig> => {
  const { cloneDeep } = await import('@modern-js/utils/lodash');
  const _config = cloneDeep(config);

  return {
    ..._config,
    source: normalizeSourceConfig(_config.source),
  };
};
