import type { CopyPluginOptions, WebpackConfig } from '../thirdParty';

export type DistPathConfig = {
  root?: string;
  js?: string;
  css?: string;
  svg?: string;
  font?: string;
  html?: string;
  image?: string;
  media?: string;
};

export type FilenameConfig = {
  js?: string;
  css?: string;
  svg?: string;
  font?: string;
  image?: string;
  media?: string;
};

export type DataUriLimit = {
  svg?: number;
  font?: number;
  image?: number;
  media?: number;
};

export type Polyfill = 'usage' | 'entry' | 'ua' | 'off';

export type AssetsRetryHookContext = {
  times: number;
  domain: string;
  url: string;
  tagName: string;
};

export type AssetsRetryOptions = {
  type?: string[];
  domain?: string[];
  max?: number;
  test?: string | ((url: string) => boolean);
  crossOrigin?: boolean;
  onRetry?: (options: AssetsRetryHookContext) => void;
  onSuccess?: (options: AssetsRetryHookContext) => void;
  onFail?: (options: AssetsRetryHookContext) => void;
};

/**
 * postcss-pxtorem options
 *
 * https://github.com/cuth/postcss-pxtorem#options
 */
export type PxToRemOptions = Partial<{
  rootValue: number;
  unitPrecision: number;
  propList: Array<string>;
  selectorBlackList: Array<string>;
  replace: boolean;
  mediaQuery: boolean;
  minPixelValue: number;
  exclude: string | RegExp | ((filePath: string) => boolean);
}>;

export type RemOptions = Partial<{
  /** Runtime options */
  /** Whether to inject runtime code into html templates。Default: true */
  enableRuntime: boolean;
  /** Usually, `fontSize = (clientWidth * rootFontSize) / screenWidth` */
  screenWidth: number;
  rootFontSize: number;
  maxRootFontSize: number;
  /** Get clientWidth from the url query based on widthQueryKey */
  widthQueryKey: string;
  /** The entries to ignore */
  excludeEntries: Array<string>;
  /** Use height to calculate rem in landscape。Default: false */
  supportLandscape: boolean;
  /**
   * Whether to use rootFontSize when large than maxRootFontSize （scene：pc）
   */
  useRootFontSizeBeyondMax: boolean;
  /** CSS (postcss-pxtorem) option */
  pxtorem: PxToRemOptions;
}>;

export type ExternalsOptions = WebpackConfig['externals'];

export interface OutputConfig {
  copy?: CopyPluginOptions | CopyPluginOptions['patterns'];
  distPath?: DistPathConfig;
  filename?: FilenameConfig;
  polyfill?: Polyfill;
  assetPrefix?: string;
  dataUriLimit?: number | DataUriLimit;
  legalComments?: 'none' | 'inline' | 'linked';
  cleanDistPath?: boolean;
  disableMinimize?: boolean;
  disableSourceMap?: boolean;
  disableFilenameHash?: boolean;
  disableInlineRuntimeChunk?: boolean;
  enableAssetManifest?: boolean;
  enableAssetFallback?: boolean;
  enableLatestDecorators?: boolean;
  enableCssModuleTSDeclaration?: boolean;
  enableInlineScripts?: boolean;
  enableInlineStyles?: boolean;
  overrideBrowserslist?: string[];
  svgDefaultExport?: 'component' | 'url';
  assetsRetry?: AssetsRetryOptions;
  convertToRem?: boolean | RemOptions;
  externals?: ExternalsOptions;
}
