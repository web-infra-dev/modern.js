export type UnbundleConfig = {
  /**
   * Some package A may require another package B that is intended for Node.js
   * use only. In such a case, if package B cannot be converted to ESM, it will
   * cause package A to fail during unbundle development, even though package B
   * is not really required. Package B can thus be safely ignored via this option
   * to ensure transpilation of package A to ESM
   */
  ignore?: string | string[];

  /**
   * ignores cached esm modules and recompiles dependencies not available
   * from PDN host on dev start.
   * default: false
   */
  ignoreModuleCache?: boolean;

  /**
   * clears cache of downloaded esm modules (from PDN) on dev start.
   * default: false
   */
  clearPdnCache?: boolean;

  /**
   * modifies host to attempt to download esm modules from
   */
  pdnHost?: string;
};
