import type { ecmaVersion as EcmaVersion } from 'acorn';

export type SriOptions = {
  hashFuncNames?: [string, ...string[]];
  enabled?: 'auto' | true | false;
  hashLoading?: 'eager' | 'lazy';
};

export type { EcmaVersion };

export interface CheckSyntaxOptions {
  targets?: string[];
  exclude?: RegExp | RegExp[];
  ecmaVersion?: EcmaVersion;
}

export interface SharedSecurityConfig {
  /**
   * Analyze the build artifacts to identify advanced syntax that is incompatible with the current browser scope.
   */
  checkSyntax?: boolean | CheckSyntaxOptions;

  /**
   * Adding an nonce attribute to sub-resources introduced by HTML allows the browser to
   * verify the nonce of the introduced resource, thus preventing xss.
   */
  nonce?: string;
}

export type NormalizedSharedSecurityConfig = Required<SharedSecurityConfig>;
