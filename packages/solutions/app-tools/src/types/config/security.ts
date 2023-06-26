import type {
  WebpackBuilderConfig,
  RspackBuilderConfig,
} from '../../builder/shared';
import { UnwrapBuilderConfig } from '../utils';

export type BuilderSecurityConfig = UnwrapBuilderConfig<
  WebpackBuilderConfig,
  'security'
>;

export type RsSecurityConfig = UnwrapBuilderConfig<
  RspackBuilderConfig,
  'security'
>;

export type SecurityUserConfig = BuilderSecurityConfig;
