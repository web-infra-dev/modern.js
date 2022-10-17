import {
  extendsType,
  DEFAULT_PORT,
  ROOT_DIST_DIR,
  HTML_DIST_DIR,
  JS_DIST_DIR,
  CSS_DIST_DIR,
  SVG_DIST_DIR,
  FONT_DIST_DIR,
  IMAGE_DIST_DIR,
  MEDIA_DIST_DIR,
  SERVER_DIST_DIR,
  mergeBuilderConfig,
  DEFAULT_DATA_URL_SIZE,
} from '@modern-js/builder-shared';
import type { BuilderConfig } from '../types';

const defineDefaultConfig = extendsType<BuilderConfig>();

export const createDefaultConfig = () =>
  defineDefaultConfig({
    dev: {
      hmr: true,
      https: false,
      port: DEFAULT_PORT,
      assetPrefix: '/',
      startUrl: false,
      progressBar: true,
    },
    html: {
      crossorigin: false,
      disableHtmlFolder: false,
    },
    tools: {
      cssExtract: {
        loaderOptions: {},
        pluginOptions: {},
      },
      tsChecker: true,
    },
    source: {
      define: {},
      alias: {},
      preEntry: [],
      globalVars: {},
      compileJsDataURI: false,
    },
    output: {
      distPath: {
        root: ROOT_DIST_DIR,
        js: JS_DIST_DIR,
        css: CSS_DIST_DIR,
        svg: SVG_DIST_DIR,
        font: FONT_DIST_DIR,
        html: HTML_DIST_DIR,
        image: IMAGE_DIST_DIR,
        media: MEDIA_DIST_DIR,
        server: SERVER_DIST_DIR,
      },
      filename: {},
      charset: 'ascii',
      polyfill: 'entry',
      dataUriLimit: {
        svg: DEFAULT_DATA_URL_SIZE,
        font: DEFAULT_DATA_URL_SIZE,
        image: DEFAULT_DATA_URL_SIZE,
        media: DEFAULT_DATA_URL_SIZE,
      },
      legalComments: 'linked',
      cleanDistPath: true,
      svgDefaultExport: 'url',
      disableMinimize: false,
      disableSourceMap: false,
      disableFilenameHash: false,
      disableInlineRuntimeChunk: false,
      enableAssetFallback: false,
      enableAssetManifest: false,
      enableLatestDecorators: false,
      enableCssModuleTSDeclaration: false,
      enableInlineScripts: false,
      enableInlineStyles: false,
    },
    security: { sri: false },
    experiments: {},
    performance: {
      removeConsole: false,
      removeMomentLocale: false,
      profile: false,
      chunkSplit: {
        strategy: 'split-by-experience',
      },
    },
  });

export const withDefaultConfig = (config: BuilderConfig) =>
  mergeBuilderConfig<BuilderConfig>(createDefaultConfig(), config);
