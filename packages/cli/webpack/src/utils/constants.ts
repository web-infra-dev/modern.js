export const CSS_REGEX = /\.css$/;

export const CSS_MODULE_REGEX = /\.module\.css$/;

export const GLOBAL_CSS_REGEX = /\.global\.css$/;

export const JS_REGEX = /\.(js|mjs|cjs|jsx)$/;

export const TS_REGEX = /\.(ts|mts|cts|tsx)$/;

export const ASSETS_REGEX =
  /\.(woff|woff2|eot|ttf|otf|ttc|gif|png|jpe?g|webp|bmp|ico|svg)$/i;

export const NODE_MODULES_REGEX = /node_modules/;

export const ICON_EXTENSIONS = ['png', 'jpg', 'jpeg', 'svg', 'ico'];

export const SVG_REGEX = /\.svg$/;

export const JS_RESOLVE_EXTENSIONS = [
  'web.mjs',
  'mjs',
  'web.js',
  'js',
  'web.ts',
  'ts',
  'web.tsx',
  'tsx',
  'web.jsx',
  'jsx',
  'json',
].map(t => `.${t}`);

export const CACHE_DIRECTORY = './node_modules/.cache';
