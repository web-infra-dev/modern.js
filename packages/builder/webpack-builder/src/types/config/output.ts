import type { CopyPluginOptions } from '../thirdParty';

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

export type PxToRemOptions = Partial<{
  /** 默认取 RemOptions['rootFontSize'] */
  rootValue: number;
  /** 精确位数 */
  unitPrecision: number;
  /** 支持转换的 css 属性，默认 ['*'] */
  propList: Array<string>;
  selectorBlackList: Array<string>;
  replace: boolean;
  mediaQuery: boolean;
  minPixelValue: number;
  exclude: string | RegExp | ((filePath: string) => boolean);
}>;

export type RemOptions = Partial<{
  /** runtime 选项 */
  /** 是否在 html 模版中注入运行时代码。默认 true */
  enableRuntime: boolean;
  screenWidth: number;
  rootFontSize: number;
  maxRootFontSize: number;
  /** 根据 widthQueryKey 的值去 url query 里取屏幕的宽度 */
  widthQueryKey: string;
  /** 不进行调整的 entry */
  excludeEntries: Array<string>;
  /** 横屏时使用 height 计算 rem。默认 false */
  supportLandscape: boolean;
  /**
   * 超过 maxRootFontSize 时，是否使用 rootFontSize。
   * 场景：rem 在 pc 上的尺寸计算正常
   */
  useRootFontSizeBeyondMax: boolean;

  /**
   * css 选项
   * 对应 https://github.com/cuth/postcss-pxtorem#options 选项
   */
  pxtorem: PxToRemOptions;
}>;

export interface OutputConfig {
  copy?: CopyPluginOptions | CopyPluginOptions['patterns'];
  distPath?: DistPathConfig;
  filename?: FilenameConfig;
  polyfill?: Polyfill;
  assetPrefix?: string;
  dataUriLimit?: number | DataUriLimit;
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
}
