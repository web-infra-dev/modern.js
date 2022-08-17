export enum STATUS {
  INITIAL = 'INITIAL',
  BEFORE_INIT_PLUGINS = 'BEFORE_INIT_PLUGINS',
  AFTER_INIT_PLUGINS = 'AFTER_INIT_PLUGINS',
  BEFORE_MODIFY_BUILDER_CONFIG = 'BEFORE_MODIFY_BUILDER_CONFIG',
  AFTER_MODIFY_BUILDER_CONFIG = 'AFTER_MODIFY_BUILDER_CONFIG',
  BEFORE_MODIFY_WEBPACK_CHAIN = 'BEFORE_MODIFY_WEBPACK_CHAIN',
  AFTER_MODIFY_WEBPACK_CHAIN = 'AFTER_MODIFY_WEBPACK_CHAIN',
  BEFORE_MODIFY_WEBPACK_CONFIG = 'BEFORE_MODIFY_WEBPACK_CONFIG',
  AFTER_MODIFY_WEBPACK_CONFIG = 'AFTER_MODIFY_WEBPACK_CONFIG',
}

export const DEFAULT_PORT = 8080;
export const DEFAULT_DATA_URL_SIZE = 10000;

export const ROOT_DIST_DIR = 'dist';
export const FONT_DIST_DIR = 'font';
export const IMAGE_DIST_DIR = 'image';
export const JS_DIST_DIR = 'js';
export const CSS_DIST_DIR = 'css';

export const FONT_EXTENSIONS = ['woff', 'woff2', 'eot', 'ttf', 'otf', 'ttc'];
export const IMAGE_EXTENSIONS = [
  'png',
  'jpg',
  'jpeg',
  'gif',
  'bmp',
  'webp',
  'ico',
  'apng',
  'avif',
  'tiff',
];
export const MEDIA_EXTENSIONS = [
  'mp4',
  'webm',
  'ogg',
  'mp3',
  'wav',
  'flac',
  'aac',
  'mov',
];
