import type { BuilderTarget } from './types';

// PACKAGES
export const RSPACK_PROVIDER = '@modern-js/builder-rspack-provider';
export const WEBPACK_PROVIDER = '@modern-js/builder-webpack-provider';

// Defaults
export const DEFAULT_PORT = 8080;
export const DEFAULT_DATA_URL_SIZE = 10000;
export const DEFAULT_MOUNT_ID = 'root';

export const DEFAULT_BROWSERSLIST = {
  web: ['> 0.01%', 'not dead', 'not op_mini all'],
  node: ['node >= 14'],
  'web-worker': ['> 0.01%', 'not dead', 'not op_mini all'],
  'service-worker': ['> 0.01%', 'not dead', 'not op_mini all'],
  'modern-web': [
    'chrome >= 61',
    'edge >= 16',
    'firefox >= 60',
    'safari >= 11',
    'ios_saf >= 11',
  ],
};

// Paths
export const ROOT_DIST_DIR = 'dist';
export const HTML_DIST_DIR = 'html';
export const SERVER_DIST_DIR = 'bundles';
export const SERVER_WORKER_DIST_DIR = 'worker';
export const JS_DIST_DIR = 'static/js';
export const CSS_DIST_DIR = 'static/css';
export const SVG_DIST_DIR = 'static/svg';
export const FONT_DIST_DIR = 'static/font';
export const WASM_DIST_DIR = 'static/wasm';
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
export const DEFAULT_ASSET_PREFIX = '/';

// RegExp
export const HTML_REGEX = /\.html$/;
export const JSON_REGEX = /\.json$/;
export const JS_REGEX = /\.(js|mjs|cjs|jsx)$/;
export const TS_REGEX = /\.(ts|mts|cts|tsx)$/;
export const SVG_REGEX = /\.svg$/;
export const CSS_REGEX = /\.css$/;
export const LESS_REGEX = /\.less$/;
export const SASS_REGEX = /\.s(a|c)ss$/;
export const STYLUS_REGEX = /\.styl$/;
export const CSS_MODULES_REGEX = /\.module\.\w+$/i;
export const GLOBAL_CSS_REGEX = /\.global\.\w+$/;
export const NODE_MODULES_REGEX = /[\\/]node_modules[\\/]/;
export const MODULE_PATH_REGEX =
  /[\\/]node_modules[\\/](\.pnpm[\\/])?(?:(@[^[\\/]+)(?:[\\/]))?([^\\/]+)/;

export const RUNTIME_CHUNK_NAME = 'builder-runtime';
export const TS_CONFIG_FILE = 'tsconfig.json';

export const TARGET_ID_MAP: Record<BuilderTarget, string> = {
  web: 'Client',
  node: 'Server',
  'service-worker': 'Server Worker',
  'modern-web': 'Modern',
  'web-worker': 'Web Worker',
};
