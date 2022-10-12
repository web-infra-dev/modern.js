import { mergeBuilderConfig } from '@modern-js/builder-shared';
import _ from '@modern-js/utils/lodash';
import { BuilderConfig, NormalizedConfig } from '../types';
import { createDefaultConfig } from './defaults';

const createNormalizer = (normalizer: NormalizedConfig) => {
  return (config: BuilderConfig): NormalizedConfig => {
    return mergeBuilderConfig<NormalizedConfig>(
      _.cloneDeep(normalizer),
      config as NormalizedConfig,
    );
  };
};

/** #__PURE__
 * 1. May used by multiple plugins.
 * 2. Object value that should not be empty.
 * 3. Meaningful and can be filled by constant value.
 */
export const normalizeConfig = createNormalizer(createDefaultConfig());
