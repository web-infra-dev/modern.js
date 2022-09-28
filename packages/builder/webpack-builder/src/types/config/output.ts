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
}
