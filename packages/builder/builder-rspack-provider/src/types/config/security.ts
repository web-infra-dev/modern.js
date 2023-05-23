import type { SharedSecurityConfig } from '@modern-js/builder-shared';

export type SecurityConfig = SharedSecurityConfig & {
  nonce?: string;
};

export type NormalizedSecurityConfig = Required<SecurityConfig>;
