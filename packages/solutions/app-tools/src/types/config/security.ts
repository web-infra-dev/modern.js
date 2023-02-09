import type { BuilderConfig } from '@modern-js/builder-webpack-provider';
import { UnwrapBuilderConfig } from '../utils';

export type BuilderSecurityConfig = UnwrapBuilderConfig<
  BuilderConfig,
  'security'
>;

export type SecurityUserConfig = BuilderSecurityConfig;
