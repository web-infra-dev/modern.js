import { mergeBuilderConfig } from '@modern-js/builder-shared';
import { BuilderConfig, NormalizedConfig } from '../types';
import { createDefaultConfig } from './defaults';

/** #__PURE__
 * 1. May used by multiple plugins.
 * 2. Object value that should not be empty.
 * 3. Meaningful and can be filled by constant value.
 */
export const normalizeConfig = (config: BuilderConfig): NormalizedConfig =>
  mergeBuilderConfig<NormalizedConfig>(
    createDefaultConfig() as NormalizedConfig,
    config as NormalizedConfig,
  );
