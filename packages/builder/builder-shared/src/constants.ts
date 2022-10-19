// Defaults
export const DEFAULT_PORT = 8080;
export const DEFAULT_DATA_URL_SIZE = 10000;
export const DEFAULT_MOUNT_ID = 'root';
export const DEFAULT_BROWSERSLIST = ['> 0.01%', 'not dead', 'not op_mini all'];

// Paths
export const ROOT_DIST_DIR = 'dist';
export const HTML_DIST_DIR = 'html';
export const SERVER_DIST_DIR = 'bundles';
export const JS_DIST_DIR = 'static/js';
export const CSS_DIST_DIR = 'static/css';
export const SVG_DIST_DIR = 'static/svg';
export const FONT_DIST_DIR = 'static/font';
export const IMAGE_DIST_DIR = 'static/image';
export const MEDIA_DIST_DIR = 'static/media';

// Extensions
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

// RegExp
export const JS_REGEX = /\.(js|mjs|cjs|jsx)$/;
export const TS_REGEX = /\.(ts|mts|cts|tsx)$/;
export const SVG_REGEX = /\.svg$/;
export const CSS_REGEX = /\.css$/;
export const LESS_REGEX = /\.less$/;
export const SASS_REGEX = /\.s(a|c)ss$/;
export const CSS_MODULE_REGEX = /\.module\.css$/;
export const GLOBAL_CSS_REGEX = /\.global\.css$/;
export const NODE_MODULES_REGEX = /node_modules/;
export const MODULE_PATH_REGEX =
  /[\\/]node_modules[\\/](\.pnpm[\\/])?(?:(@[^[\\/]+)(?:[\\/]))?([^\\/]+)/;

export const RUNTIME_CHUNK_NAME = 'builder-runtime';
