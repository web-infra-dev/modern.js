import type { SharedBuilderConfig } from '@modern-js/builder-shared';

export type BuilderSecurityConfig = Required<SharedBuilderConfig>['security'];

export type SecurityUserConfig = BuilderSecurityConfig;

export type SecurityNormalizedConfig = SecurityUserConfig;
