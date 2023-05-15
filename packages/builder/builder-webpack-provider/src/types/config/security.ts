import type { SharedSecurityConfig } from '@modern-js/builder-shared';

export interface CheckSyntaxOptions {
  targets: string[];
  exclude?: RegExp | Array<RegExp>;
}

export type SecurityConfig = SharedSecurityConfig;

export type NormalizedSecurityConfig = Required<SecurityConfig>;
