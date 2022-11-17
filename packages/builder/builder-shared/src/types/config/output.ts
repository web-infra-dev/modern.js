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
  /** The data URI limit of the SVG image. */
  svg?: number;
  /** The data URI limit of the font file. */
  font?: number;
  /** The data URI limit of non-SVG images. */
  image?: number;
  /** The data URI limit of media resources such as videos. */
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
  /**
   * Configure how the polyfill is injected.
   */
  polyfill?: Polyfill;
  /**
   * Configure the retry of assets.
   */
  assetsRetry?: AssetsRetryOptions;
  /**
   * When using CDN in the production environment,
   * you can use this option to set the URL prefix of static resources,
   * similar to the output.publicPath config of webpack.
   */
  assetPrefix?: string;
  /**
   * Set the size threshold to inline static resources such as images and fonts.
   * By default, static resources will be Base64 encoded and inline into the page if the size is less than 10KB.
   */
  dataUriLimit?: number | DataUriLimit;
  /**
   * Configure how to handle the legal comment.
   * A "legal comment" is considered to be any statement-level comment in JS or rule-level
   * comment in CSS that contains @license or @preserve or that starts with //! or /\*!.
   * These comments are preserved in output files by default since that follows the intent
   * of the original authors of the code.
   */
  legalComments?: LegalComments;
  /**
   * Whether to clean all files in the dist path before starting compilation.
   */
  cleanDistPath?: boolean;
  /**
   * Set the local ident name of CSS modules.
   */
  cssModuleLocalIdentName?: string;
  /**
   * Whether to disable code minification in production build.
   */
  disableMinimize?: boolean;
  /**
   * Whether to disable source map.
   */
  disableSourceMap?: boolean;
  /**
   * Remove the hash from the name of static files after production build.
   */
  disableFilenameHash?: boolean;
  /**
   * Controls whether to the inline the runtime chunk to HTML.
   */
  disableInlineRuntimeChunk?: boolean;
  /**
   * Whether to treat all .css files in the source directory as CSS Modules.
   */
  disableCssModuleExtension?: boolean;
  /**
   * Whether to generate a manifest file that contains information of all assets.
   */
  enableAssetManifest?: boolean;
  /**
   * If this option is enabled, all unrecognized files will be emitted to the dist directory.
   * Otherwise, an exception will be thrown.
   */
  enableAssetFallback?: boolean;
  /**
   * Whether to use the new decorator proposal.
   */
  enableLatestDecorators?: boolean;
  /**
   * Whether to generate a TypeScript declaration file for CSS modules.
   */
  enableCssModuleTSDeclaration?: boolean;
  /**
   * Whether to inline output scripts files (.js files) into HTML with `<script>` tags.
   */
  enableInlineScripts?: boolean;
  /**
   * Whether to inline output style files (.css files) into html with `<style>` tags.
   */
  enableInlineStyles?: boolean;
  /**
   * Specifies the range of target browsers that the project is compatible with.
   * This value will be used by [@babel/preset-env](https://babeljs.io/docs/en/babel-preset-env) and
   * [autoprefixer](https://github.com/postcss/autoprefixer) to identify the JavaScript syntax that
   * need to be transformed and the CSS browser prefixes that need to be added.
   */
  overrideBrowserslist?: string[];
  /**
   * Configure the default export type of SVG files.
   */
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
