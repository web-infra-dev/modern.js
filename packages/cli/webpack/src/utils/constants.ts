export const CSS_REGEX = /\.css$/;

export const CSS_MODULE_REGEX = /\.module\.css$/;

export const JS_REGEX = /\.(js|mjs|jsx)$/;

export const TS_REGEX = /\.tsx?$/;

export const ASSETS_REGEX =
  /\.(woff|woff2|eot|ttf|otf|ttc|gif|png|jpe?g|webp|bmp|ico)$/i;

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
  'json',
  'web.jsx',
  'jsx',
].map(t => `.${t}`);

export const CACHE_DIRECTORY = './node_modules/.cache';
