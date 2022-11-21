import type { BuilderConfig } from '@modern-js/builder-webpack-provider';

export type BuilderSecurityConfig = Required<BuilderConfig>['security'];

export type SecurityUserConfig = BuilderSecurityConfig;

export type SecurityNormalizedConfig = SecurityUserConfig;
