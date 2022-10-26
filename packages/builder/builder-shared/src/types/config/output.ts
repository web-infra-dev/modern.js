export type DistPathConfig = {
  /** The root directory of all files. */
  root?: string;
  /** The output directory of JavaScript files. */
  js?: string;
  /** The output directory of CSS style files. */
  css?: string;
  /** The output directory of SVG images. */
  svg?: string;
  /** The output directory of font files. */
  font?: string;
  /** The output directory of HTML files. */
  html?: string;
  /** The output directory of non-SVG images. */
  image?: string;
  /** The output directory of media resources, such as videos. */
  media?: string;
  /** The output directory of server bundles when target is `node`. */
  server?: string;
};

export type FilenameConfig = {
  /** The name of the JavaScript file. */
  js?: string;
  /** The name of the CSS style file. */
  css?: string;
  /** The name of the SVG image. */
  svg?: string;
  /** The name of the font file. */
  font?: string;
  /** The name of a non-SVG image. */
  image?: string;
  /** The name of a media resource, such as a video. */
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
  /**
   * Set the directory of the dist files.
   * Builder will output files to the corresponding subdirectory according to the file type.
   */
  distPath?: DistPathConfig;
  /**
   * Sets the filename of dist files.
   */
  filename?: FilenameConfig;
  /**
   * By default, Builder's output is ASCII-only and will escape all non-ASCII characters.
   * If you want to output the original characters without using escape sequences,
   * you can set `output.charset` to `utf8`.
   */
  charset?: Charset;
  polyfill?: Polyfill;
  /**
   * When using CDN in the production environment,
   * you can use this option to set the URL prefix of static resources,
   * similar to the output.publicPath config of webpack.
   */
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
