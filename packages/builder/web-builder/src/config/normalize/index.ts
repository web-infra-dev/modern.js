import _ from 'lodash';
import type { BuilderConfig, BuilderFinalConfig } from '../../types';
import normalizeSourceConfig from './source';

export const normalizeConfig = (config: BuilderConfig): BuilderFinalConfig => {
  const _config = _.cloneDeep(config);
  return {
    ..._config,
    source: normalizeSourceConfig(_config.source),
  };
};
