import type { InlineChunkTest } from '../../plugins/InlineChunkHtmlPlugin';
import type { BuilderTarget } from '../builder';
import type { CrossOrigin } from './html';
import type { Externals } from 'webpack';

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
  /** The output directory of Wasm files. */
  wasm?: string;
  /** The output directory of non-SVG images. */
  image?: string;
  /** The output directory of media resources, such as videos. */
  media?: string;
  /** The output directory of server bundles when target is `node`. */
  server?: string;
  /** The output directory of server bundles when target is `service-worker`. */
  worker?: string;
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
  crossOrigin?: boolean | CrossOrigin;
  inlineScript?: boolean;
  onFail?: (options: AssetsRetryHookContext) => void;
  onRetry?: (options: AssetsRetryHookContext) => void;
  onSuccess?: (options: AssetsRetryHookContext) => void;
};

export type Charset = 'ascii' | 'utf8';

export type SvgDefaultExport = 'component' | 'url';

export type LegalComments = 'none' | 'inline' | 'linked';

export type NormalizedDataUriLimit = Required<DataUriLimit>;

export type Polyfill = 'usage' | 'entry' | 'ua' | 'off';

export type DisableSourceMapOption =
  | boolean
  | {
      js?: boolean;
      css?: boolean;
    };

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
  /**
   * Whether to generate runtime code to set root font size.
   * @default true
   */
  enableRuntime?: boolean;
  /**
   *  Whether to inline runtime code to HTML.
   * @default true
   */
  inlineRuntime?: boolean;
  /** Usually, `fontSize = (clientWidth * rootFontSize) / screenWidth` */
  screenWidth?: number;
  rootFontSize?: number;
  maxRootFontSize?: number;
  /** Get clientWidth from the url query based on widthQueryKey */
  widthQueryKey?: string;
  /** The entries to ignore */
  excludeEntries?: string[];
  /**
   * Whether to use height to calculate rem in landscape.
   * @default false
   */
  supportLandscape?: boolean;
  /** Whether to use rootFontSize when large than maxRootFontSize（scene：pc） */
  useRootFontSizeBeyondMax?: boolean;
  /** CSS (postcss-pxtorem) option */
  pxtorem?: PxToRemOptions;
};

export type CssModuleLocalsConvention =
  | 'asIs'
  | 'camelCase'
  | 'camelCaseOnly'
  | 'dashes'
  | 'dashesOnly';

export type CssModules = {
  exportLocalsConvention?: CssModuleLocalsConvention;
  auto?: boolean | RegExp | ((resourcePath: string) => boolean);
};

export interface SharedOutputConfig {
  /**
   * At build time, prevent some `import` dependencies from being packed into bundles in your code, and instead fetch them externally at runtime.
   * For more information, please see: [webpack Externals](https://webpack.js.org/configuration/externals/)
   */
  externals?: Externals;
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
   * you can use this option to set the URL prefix of static assets,
   * similar to the output.publicPath config of webpack.
   */
  assetPrefix?: string;
  /**
   * Set the size threshold to inline static assets such as images and fonts.
   * By default, static assets will be Base64 encoded and inline into the page if the size is less than 10KB.
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
   * Allows to enable/disable CSS Modules or setup configuration.
   */
  cssModules?: CssModules;

  /**
   * Convert px to rem in CSS.
   */
  convertToRem?: boolean | RemOptions;

  /**
   * Disable css extract and inline CSS files into the JS bundle.
   */
  disableCssExtract?: boolean;
  /**
   * Whether to disable code minification in production build.
   */
  disableMinimize?: boolean;
  /**
   * Whether to disable source map.
   */
  disableSourceMap?: DisableSourceMapOption;
  /**
   * Whether to disable TypeScript Type Checker.
   */
  disableTsChecker?: boolean;
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
  enableInlineScripts?: boolean | InlineChunkTest;
  /**
   * Whether to inline output style files (.css files) into html with `<style>` tags.
   */
  enableInlineStyles?: boolean | InlineChunkTest;
  /**
   * Specifies the range of target browsers that the project is compatible with.
   * This value will be used by [@babel/preset-env](https://babeljs.io/docs/en/babel-preset-env) and
   * [autoprefixer](https://github.com/postcss/autoprefixer) to identify the JavaScript syntax that
   * need to be transformed and the CSS browser prefixes that need to be added.
   */
  overrideBrowserslist?: string[] | Partial<Record<BuilderTarget, string[]>>;
  /**
   * Configure the default export type of SVG files.
   */
  svgDefaultExport?: SvgDefaultExport;
  /**
   * Whether to transform SVGs into React components. If true, will treat all .svg files as assets.
   */
  disableSvgr?: boolean;
}

export interface NormalizedSharedOutputConfig extends SharedOutputConfig {
  filename: FilenameConfig;
  distPath: DistPathConfig;
  polyfill: Polyfill;
  assetPrefix: string;
  dataUriLimit: NormalizedDataUriLimit;
  cleanDistPath: boolean;
  disableCssExtract: boolean;
  disableMinimize: boolean;
  disableSourceMap: DisableSourceMapOption;
  disableTsChecker: boolean;
  disableFilenameHash: boolean;
  disableInlineRuntimeChunk: boolean;
  enableAssetManifest: boolean;
  enableAssetFallback: boolean;
  enableLatestDecorators: boolean;
  enableCssModuleTSDeclaration: boolean;
  enableInlineScripts: boolean | InlineChunkTest;
  enableInlineStyles: boolean | InlineChunkTest;
  svgDefaultExport: SvgDefaultExport;
  cssModules: {
    exportLocalsConvention: CssModuleLocalsConvention;
    auto?: CssModules['auto'];
  };
  disableSvgr: boolean;
  externals?: Externals;
}
