import {
  extendsType,
  defaultsToBuilderConfig,
} from '@modern-js/builder-shared';
import { BuilderConfig, NormalizedConfig } from '../types';
import { createDefaultConfig } from './defaults';

const defineNormalizedDefaultConfig = extendsType<NormalizedConfig>();

const createNormalizedDefaultConfig = () =>
  defineNormalizedDefaultConfig({
    ...createDefaultConfig(),
  });

/** #__PURE__
 * 1. May used by multiple plugins.
 * 2. Object value that should not be empty.
 * 3. Meaningful and can be filled by constant value.
 */
export const normalizeConfig = (config: BuilderConfig): NormalizedConfig =>
  defaultsToBuilderConfig<NormalizedConfig>(
    createNormalizedDefaultConfig(),
    config as NormalizedConfig,
  );
