import type { BuilderConfig } from '@modern-js/builder-webpack-provider';
import type { BuilderConfig as RsBuilderConfig } from '@modern-js/builder-rspack-provider';

import { UnwrapBuilderConfig } from '../utils';

export type BuilderSecurityConfig = UnwrapBuilderConfig<
  BuilderConfig,
  'security'
>;

export type RsSecurityConfig = UnwrapBuilderConfig<RsBuilderConfig, 'security'>;

export type SecurityUserConfig = BuilderSecurityConfig;
