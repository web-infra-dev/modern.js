import type { SharedSecurityConfig } from '@modern-js/builder-shared';

export interface CheckSyntaxOptions {
  targets: string[];
  exclude?: RegExp | Array<RegExp>;
}

export type SecurityConfig = SharedSecurityConfig & {
  /** Analyze the product for the presence of high-level syntax that is not compatible in the specified environment */
  checkSyntax?: boolean | CheckSyntaxOptions;
};

export type NormalizedSecurityConfig = Required<SecurityConfig>;
