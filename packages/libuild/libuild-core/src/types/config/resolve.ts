/**
 * Options for the resolver.
 */
export type Resolve = {
  /**
   * This is only valid for enhanced-resolve
   */
  alias?: Record<string, string>;
  mainFields?: string[];
  /**
   * @internal This is only valid for enhanced-resolve
   */
  mainFiles?: string[];
  /**
   * @internal This is only valid for enhanced-resolve
   */
  preferRelative?: boolean;
};

export type ResolveNormalized = Required<Resolve>;
