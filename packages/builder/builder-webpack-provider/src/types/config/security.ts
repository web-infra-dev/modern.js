import type { SharedSecurityConfig } from '@modern-js/builder-shared';

export type SecurityConfig = SharedSecurityConfig & {
  /** Analyze the product for the presence of high-level syntax that is not compatible in the specified environment */
  checkSyntax?: boolean | { targets: string[] };
};

export type NormalizedSecurityConfig = Required<SecurityConfig>;
