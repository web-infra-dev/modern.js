import { BuilderConfig, Config } from '../types';
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
import _ from '@modern-js/utils/lodash';

export const defineConfig = (config: BuilderConfig): BuilderConfig => config;

const defineConfigPreserveDetails = <T extends BuilderConfig>(config: T): T =>
  config;

const defaultConfig = defineConfigPreserveDetails({
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
    devServer: {
      hot: true,
      client: {},
      devMiddleware: {
        writeToDisk: true,
      },
      liveReload: true,
      watch: true,
      https: false,
    },
    htmlPlugin: undefined,
    less: {},
    postcss: {},
    minifyCss: undefined,
    sass: {},
    styleLoader: {},
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
    tsChecker: {},
    tsLoader: {},
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

export type DefaultConfig = typeof defaultConfig;

export const cloneDefaultConfig = (): Config =>
  // typescript unable to match the type of defaultConfig
  _.cloneDeep(defaultConfig) as unknown as Config;

export const withDefaultConfig = (config: BuilderConfig) =>
  // typescript unable to match the type of defaultConfig
  mergeBuilderConfig(cloneDefaultConfig(), config as any);
