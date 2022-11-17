import type {
  SharedOutputConfig,
  NormalizedSharedOutputConfig,
} from '@modern-js/builder-shared';

/**
 * postcss-pxtorem options
 * https://github.com/cuth/postcss-pxtorem#options
 */
export type PxToRemOptions = {
  rootValue?: number;
  unitPrecision?: number;
  propList?: Array<string>;
  selectorBlackList?: Array<string>;
  replace?: boolean;
  mediaQuery?: boolean;
  minPixelValue?: number;
  exclude?: string | RegExp | ((filePath: string) => boolean);
};

export type RemOptions = {
  // TODO: not yet support runtime inject
  // /** Whether to inject runtime code into html templates。Default: true */
  // enableRuntime?: boolean;
  // /** Usually, `fontSize = (clientWidth * rootFontSize) / screenWidth` */
  // screenWidth?: number;
  // rootFontSize?: number;
  // maxRootFontSize?: number;
  // /** Get clientWidth from the url query based on widthQueryKey */
  // widthQueryKey?: string;
  // /** The entries to ignore */
  // excludeEntries?: string[];
  // /** Use height to calculate rem in landscape。Default: false */
  // supportLandscape?: boolean;
  // /** Whether to use rootFontSize when large than maxRootFontSize（scene：pc） */
  // useRootFontSizeBeyondMax?: boolean;
  /** CSS (postcss-pxtorem) option */
  pxtorem?: PxToRemOptions;
};

export type OutputConfig = SharedOutputConfig & {
  /**
   * Copies the specified file or directory to the dist directory.
   * TODO: not support yet
   */
  // copy?: CopyPluginOptions | CopyPluginOptions['patterns'];
  /**
   * Convert px to rem in CSS.
   */
  convertToRem?: boolean | RemOptions;
  /**
   * At build time, prevent some `import` dependencies from being packed into bundles in your code, and instead fetch them externally at runtime.
   */
  externals?: Record<string, string>;
};

export type NormalizedOutputConfig = OutputConfig &
  NormalizedSharedOutputConfig;
