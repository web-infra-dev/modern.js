export type SriOptions = {
  hashFuncNames?: [string, ...string[]];
  enabled?: 'auto' | true | false;
  hashLoading?: 'eager' | 'lazy';
};

export interface CheckSyntaxOptions {
  targets: string[];
  exclude?: RegExp | Array<RegExp>;
}

export interface SharedSecurityConfig {
  /** Analyze the product for the presence of high-level syntax that is not compatible in the specified environment */
  checkSyntax?: boolean | CheckSyntaxOptions;

  /**
   * Adding an nonce attribute to sub-resources introduced by HTML allows the browser to
   * verify the nonce of the introduced resource, thus preventing xss.
   */
  nonce?: string;
}
