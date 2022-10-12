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
  dev: {
    hmr: true,
    assetPrefix: '/',
    progressBar: true,
  },
  html: {
    crossorigin: false,
    disableHtmlFolder: false,
  },
  tools: {
    tsChecker: {},
  },
  source: {
    compileJsDataURI: false,
  },
  output: {
    filename: {},
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
    dataUriLimit: {},
    legalComments: 'linked',
    cleanDistPath: true,
    svgDefaultExport: 'url',
    disableMinimize: false,
    disableSourceMap: false,
    disableFilenameHash: false,
    enableAssetFallback: false,
    enableAssetManifest: false,
    enableLatestDecorators: false,
    enableCssModuleTSDeclaration: false,
  },
  security: {},
  experiments: {},
  performance: {
    removeConsole: false,
    removeMomentLocale: false,
    chunkSplit: {
      strategy: 'split-by-experience',
    },
  },
});

export const withDefaultConfig = (config: BuilderConfig) =>
  mergeBuilderConfig(createDefaultConfig(), config);
