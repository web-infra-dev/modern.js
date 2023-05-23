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
}
