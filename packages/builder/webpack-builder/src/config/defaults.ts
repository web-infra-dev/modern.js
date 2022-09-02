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

type KeysMatching<T extends object, V> = {
  [K in keyof T]-?: T[K] extends V ? K : never;
}[keyof T];

type ObjectProps<T extends Record<any, any>> = Pick<
  T,
  KeysMatching<T, Record<any, any>>
>;

export type DeepFillObjectBy<T extends object, P extends T> = {
  [K in keyof T & keyof ObjectProps<P>]-?: Exclude<
    Exclude<T[K], undefined> extends object
      ? unknown &
          DeepFillObjectBy<Exclude<T[K], undefined>, Exclude<P[K], undefined>>
      : T[K],
    undefined
  >;
} & {
  [K in Exclude<keyof T, keyof ObjectProps<P>>]: T[K] extends Record<any, any>
    ? unknown & DeepFillObjectBy<T[K], P[K]>
    : T[K];
};

export type Config = DeepFillObjectBy<BuilderConfig, DefaultConfig>;

export const cloneDefaultConfig = (): BuilderConfig =>
  _.cloneDeep(defaultConfig);

export const withDefaultConfig = (config: BuilderConfig) =>
  mergeBuilderConfig(cloneDefaultConfig(), config);
