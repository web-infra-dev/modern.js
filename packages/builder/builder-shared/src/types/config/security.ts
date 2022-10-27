export type SriOptions = {
  hashFuncNames?: [string, ...string[]];
  enabled?: 'auto' | true | false;
  hashLoading?: 'eager' | 'lazy';
};

export interface SharedSecurityConfig {
  /**
   * Adding an integrity attribute (`integrity`) to sub-resources introduced by HTML allows the browser to
   * verify the integrity of the introduced resource, thus preventing tampering with the downloaded resource.
   */
  sri?: SriOptions | boolean;
}
