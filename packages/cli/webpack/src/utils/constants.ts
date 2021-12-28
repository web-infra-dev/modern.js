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

const FRAMEWORK_BUNDLES = [
  `react`,
  `react-dom`,
  `react-router`,
  'react-router-dom',
  `scheduler`,
  `prop-types`,
];

export const DEFAULT_SPLIT_CHUNKS = {
  chunks: 'all',
  cacheGroups: {
    default: false,
    defaultVendors: false,
    framework: {
      chunks: 'all',
      name: 'framework',
      test: new RegExp(
        `(?<!node_modules.*)[\\\\/]node_modules[\\\\/](${FRAMEWORK_BUNDLES.join(
          `|`,
        )})[\\\\/]`,
      ),
      priority: 40,
      enforce: true,
    },
    modenrRuntime: {
      chunks: 'all',
      name: 'modern-runtime',
      test: /\/node_modules\/.*@modern-js\//,
      priority: 30,
      enforce: true,
    },
    polyfill: {
      chunks: 'all',
      name: 'polyfill',
      test: /\/node_modules\/.*core-js\//,
      priority: 30,
      enforce: true,
    },
    lib: {
      test(module: any) {
        return (
          module.size() > 160000 &&
          /node_modules[/\\]/.test(module.identifier())
        );
      },
      priority: 20,
      minChunks: 1,
      reuseExistingChunk: true,
    },
    common: {
      name: 'commons',
      minChunks: 2,
      priority: 10,
      reuseExistingChunk: true,
    },
  },
};
