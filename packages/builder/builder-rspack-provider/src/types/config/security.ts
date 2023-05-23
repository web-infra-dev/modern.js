// Todo support security.sri configuration
/**
 * Currently, rspack does not support the security.sri configuration.
 * But it should because it's a shared configuration.
 */
// import type { SharedSecurityConfig } from '@modern-js/builder-shared';

// export type SecurityConfig = SharedSecurityConfig;

// export type NormalizedSecurityConfig = Required<SecurityConfig>;

export interface SecurityConfig {
  nonce?: string;
}

export type NormalizedSecurityConfig = Required<SecurityConfig>;
