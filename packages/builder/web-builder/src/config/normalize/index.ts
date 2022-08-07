import _ from 'lodash';
import normalizeSourceConfig from './source';
import type { BuilderConfig, BuilderFinalConfig } from '../../types';

export const normalizeConfig = (config: BuilderConfig): BuilderFinalConfig => {
  const _config = _.cloneDeep(config);
  return {
    ..._config,
    source: normalizeSourceConfig(_config.source),
  };
};
