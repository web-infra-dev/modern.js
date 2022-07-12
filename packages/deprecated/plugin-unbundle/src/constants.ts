import path from 'path';

export const MODE = 'development';

export const WEB_MODULES_DIR = './node_modules/.modern_js_web_modules';

export const META_DATA_FILE_NAME = 'metadata.json';

export const DEFAULT_DEPS: string[] = [
  'react',
  'react-dom',
  '@modern-js/runtime',
  '@modern-js/runtime/loadable',
  '@modern-js/runtime/model',
  '@modern-js/runtime/styled',
  '@modern-js/runtime/head',
  '@modern-js/runtime/model',
  '@modern-js/runtime/plugins',
  '@modern-js/runtime/router',
  '@modern-js/runtime/ssr',
  '@modern-js/create-request',
];

export const MODERN_JS_INTERNAL_PACKAGES: Record<string, string> = {
  '@modern-js/plugin-state': '@modern-js/runtime',
  '@modern-js/plugin-router': '@modern-js/runtime',
  '@modern-js/plugin-ssr': '@modern-js/runtime',
  '@modern-js/create-request/client': '@modern-js/plugin-unbundle',
};

export const VIRTUAL_DEPS_MAP: Record<string, string> = {
  '@modern-js/create-request': `export * from '@modern-js/create-request/client';`,
  '@modern-js/runtime/plugins': `
    export { default as router } from '@modern-js/plugin-router';
    export { default as ssr } from '@modern-js/plugin-ssr';
    export { default as state } from '@modern-js/plugin-state';
  `,
  '@modern-js/runtime/router': `export * from '@modern-js/plugin-router';`,
  '@modern-js/runtime/model': `export * from '@modern-js/plugin-state';`,
  '@modern-js/runtime/ssr': `export * from '@modern-js/plugin-ssr';`,
  domino: 'export {}; export default {};',
};

export const HOST = '0.0.0.0';

// [@\w] - Match a word-character or @ (valid package name)
// (?!.*(:\/\/)) - Ignore if previous match was a protocol (ex: http://)
export const BARE_SPECIFIER_REGEX = /^[@\w](?!.*(:\/\/))/;

export const DEFAULT_EXTENSIONS = [
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
].map(ext => `.${ext}`);

export const CSS_REGEX = /\.(css|sass|scss|less)($|\?)/;
export const CSS_MODULE_REGEX = /\.module.(css|sass|scss|less)($|\?)/;

// hmr sockjs client, should inject modern build into client
export const DEV_CLIENT_PATH = path.resolve(__dirname, '../modern/client');

export const DEV_CLIENT_PATH_ALIAS = `@_modern_js_dev_client`;

export const DEV_CLIENT_URL = `/${DEV_CLIENT_PATH_ALIAS}/index.js`;

export const ASSETS_REGEX =
  /\.(gif|png|jpe?g|webp|bmp|ico|svg|woff|woff2|eot|ttf|otf|ttc)$/;

export const IS_DISABLE_REACT_REFRESH = process.env.FAST_REFRESH === 'false';

export const CSS_URL_FUNCTION_REGEX =
  /url\(\s*('[^']+?'|"[^"]+?"|[^'"]+?)\s*\)/g;

export const GLOBAL_CACHE_DIR_NAME = '__modern_js_web_modules__';

// cjs node_modules to esm node_modules
export const TEMP_MODULES_DIR = './node_modules/.cache/modern_js_modules';

// babel macros extensions
export const BABEL_MACRO_EXTENSIONS = '.macro';

// api function file query
export const LAMBDA_API_FUNCTION_QUERY = '__lambda_api_function__';

// dependencies that should be ignored in deps optimizaion
// can't convert to esm format
export const IGNORE_OPTIMIZE_DEPS = ['domino'];

// default lazy import ui components library
export const DEFAULT_LAZY_IMPORT_UI_COMPONENTS = [
  'antd',
  '@arco-design/web-react',
];

export const ESBUILD_RESOLVE_PLUGIN_NAME = 'esm-resolve-plugin';

export const BFF_API_DIR = './api';

export const DEFAULT_PDN_HOST = `pdn.zijieapi.com`;
