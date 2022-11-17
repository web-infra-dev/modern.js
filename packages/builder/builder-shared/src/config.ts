import {
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
  DEFAULT_DATA_URL_SIZE,
} from './constants';
import type {
  NormalizedSharedDevConfig,
  NormalizedSharedOutputConfig,
  SharedHtmlConfig,
  NormalizedSharedSourceConfig,
} from './types';

export const defaultDevConfig: NormalizedSharedDevConfig = {
  hmr: true,
  https: false,
  port: DEFAULT_PORT,
  assetPrefix: '/',
  startUrl: false,
  progressBar: true,
};

export const defaultSourceConfig: NormalizedSharedSourceConfig = {
  define: {},
  alias: {},
  preEntry: [],
  globalVars: {},
  compileJsDataURI: true,
};

export const defaultHtmlConfig: SharedHtmlConfig = {
  crossorigin: false,
  disableHtmlFolder: false,
};

export const defaultOutputConfig: NormalizedSharedOutputConfig = {
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
  disableCssModuleExtension: false,
  disableInlineRuntimeChunk: false,
  enableAssetFallback: false,
  enableAssetManifest: false,
  enableLatestDecorators: false,
  enableCssModuleTSDeclaration: false,
  enableInlineScripts: false,
  enableInlineStyles: false,
};
