import type { ecmaVersion as EcmaVersion } from 'acorn';

export type SriOptions = {
  hashFuncNames?: [string, ...string[]];
  enabled?: 'auto' | true | false;
  hashLoading?: 'eager' | 'lazy';
};

export type { EcmaVersion };

export interface CheckSyntaxOptions {
  /**
   * The target browser range of the project.
   * Its value is a standard browserslist array.
   */
  targets?: string[];
  /**
   * The minimum ECMAScript syntax version that can be used in the build artifact.
   * The priority of `ecmaVersion` is higher than `targets`.
   */
  exclude?: RegExp | RegExp[];
  /**
   * Used to exclude a portion of files during detection.
   * You can pass in one or more regular expressions to match the paths of source files.
   */
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
