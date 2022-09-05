import { BuilderConfig } from '../types';
import { mergeBuilderConfig } from '../shared/utils';
import {
  ROOT_DIST_DIR,
  HTML_DIST_DIR,
  JS_DIST_DIR,
  CSS_DIST_DIR,
  SVG_DIST_DIR,
  FONT_DIST_DIR,
  IMAGE_DIST_DIR,
  MEDIA_DIST_DIR,
} from '../shared';

export const createDefaultConfig = (): BuilderConfig => ({
  source: {
    alias: {},
    globalVars: {},
    moduleScopes: undefined,
    preEntry: [],
    resolveExtensionPrefix: undefined,
  },
  output: {
    copy: undefined,
    filename: {
      css: undefined,
      font: undefined,
      image: undefined,
      js: undefined,
      media: undefined,
      svg: undefined,
    },
    assetPrefix: undefined,
    dataUriLimit: {},
    distPath: {
      root: ROOT_DIST_DIR,
      html: HTML_DIST_DIR,
      js: JS_DIST_DIR,
      css: CSS_DIST_DIR,
      svg: SVG_DIST_DIR,
      font: FONT_DIST_DIR,
      image: IMAGE_DIST_DIR,
      media: MEDIA_DIST_DIR,
    },
    polyfill: 'entry',
    svgDefaultExport: 'url',
    disableFilenameHash: false,
    disableMinimize: false,
    disableSourceMap: false,
    enableAssetFallback: false,
    enableAssetManifest: false,
    enableCssModuleTSDeclaration: false,
    enableLatestDecorators: false,
  },
  dev: {
    assetPrefix: '/',
  },
  tools: {
    babel: undefined, // @sanyuan
    autoprefixer: undefined,
    cssExtract: undefined,
    cssLoader: undefined,
    devServer: undefined,
    htmlPlugin: undefined,
    less: {},
    postcss: {},
    minifyCss: undefined,
    sass: {},
    styleLoader: undefined,
    styledComponents: undefined,
    pug: undefined,
    terser: {
      terserOptions: {
        mangle: {
          safari10: true,
        },
        format: {
          ascii_only: true,
        },
      },
    },
    tsChecker: false,
    tsLoader: undefined,
    webpack: undefined,
    webpackChain: undefined,
  },
  experiments: {},
  html: {
    disableHtmlFolder: false,
  },
  performance: {
    bundleAnalyze: undefined,
    removeConsole: false,
    chunkSplit: {
      strategy: 'split-by-module',
    },
    removeMomentLocale: false,
  },
  security: {},
});

export const withDefaultConfig = (config: BuilderConfig) =>
  mergeBuilderConfig(createDefaultConfig(), config);
