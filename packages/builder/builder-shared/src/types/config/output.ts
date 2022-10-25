export type DistPathConfig = {
  root?: string;
  js?: string;
  css?: string;
  svg?: string;
  font?: string;
  html?: string;
  image?: string;
  media?: string;
  server?: string;
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

export type AssetsRetryHookContext = {
  url: string;
  times: number;
  domain: string;
  tagName: string;
};

export type AssetsRetryOptions = {
  max?: number;
  type?: string[];
  test?: string | ((url: string) => boolean);
  domain?: string[];
  crossOrigin?: boolean;
  onFail?: (options: AssetsRetryHookContext) => void;
  onRetry?: (options: AssetsRetryHookContext) => void;
  onSuccess?: (options: AssetsRetryHookContext) => void;
};

export type Charset = 'ascii' | 'utf8';

export type SvgDefaultExport = 'component' | 'url';

export type LegalComments = 'none' | 'inline' | 'linked';

export type NormalizedDataUriLimit = Required<DataUriLimit>;

export type Polyfill = 'usage' | 'entry' | 'ua' | 'off';

export interface SharedOutputConfig {
  distPath?: DistPathConfig;
  filename?: FilenameConfig;
  charset?: Charset;
  polyfill?: Polyfill;
  assetPrefix?: string;
  dataUriLimit?: number | DataUriLimit;
  legalComments?: LegalComments;
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
  svgDefaultExport?: SvgDefaultExport;
}

export interface NormalizedSharedOutputConfig extends SharedOutputConfig {
  filename: FilenameConfig;
  distPath: DistPathConfig;
  polyfill: Polyfill;
  assetsRetry?: AssetsRetryOptions;
  dataUriLimit: NormalizedDataUriLimit;
  cleanDistPath: boolean;
  disableMinimize: boolean;
  disableSourceMap: boolean;
  disableFilenameHash: boolean;
  disableInlineRuntimeChunk: boolean;
  enableAssetManifest: boolean;
  enableAssetFallback: boolean;
  enableLatestDecorators: boolean;
  enableCssModuleTSDeclaration: boolean;
  enableInlineScripts: boolean;
  enableInlineStyles: boolean;
  svgDefaultExport: SvgDefaultExport;
}
