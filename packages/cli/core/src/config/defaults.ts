import { OutputConfig, ServerConfig, SourceConfig } from '.';

const sourceDefaults: SourceConfig = {
  entries: undefined,
  disableDefaultEntries: false,
  entriesDir: './src',
  configDir: './config',
  apiDir: './api',
  envVars: [],
  globalVars: undefined,
  alias: undefined,
  moduleScopes: undefined,
  include: [],
};

const outputDefaults: OutputConfig = {
  assetPrefix: '/',
  htmlPath: 'html',
  jsPath: 'static/js',
  cssPath: 'static/css',
  mediaPath: 'static/media',
  path: 'dist',
  title: '',
  titleByEntries: undefined,
  meta: {
    charset: { charset: 'utf-8' },
    viewport:
      'width=device-width, initial-scale=1.0, shrink-to-fit=no, viewport-fit=cover, minimum-scale=1.0, maximum-scale=1.0, user-scalable=no',
    'http-equiv': { 'http-equiv': 'x-ua-compatible', content: 'ie=edge' },
    renderer: 'webkit',
    layoutmode: 'standard',
    imagemode: 'force',
    'wap-font-scale': 'no',
    'format-detection': 'telephone=no',
  },
  metaByEntries: undefined,
  inject: 'head',
  injectByEntries: undefined,
  mountId: 'root',
  favicon: '',
  faviconByEntries: undefined,
  copy: undefined,
  scriptExt: undefined,
  disableHtmlFolder: false,
  disableCssModuleExtension: false,
  disableCssExtract: false,
  enableCssModuleTSDeclaration: false,
  disableMinimize: false,
  enableInlineStyles: false,
  enableInlineScripts: false,
  disableSourceMap: false,
  disableInlineRuntimeChunk: false,
  disableAssetsCache: false,
  enableLatestDecorators: false,
  polyfill: 'entry',
  dataUriLimit: 10000,
  templateParameters: {},
  templateParametersByEntries: undefined,
  cssModuleLocalIdentName: '[name]__[local]--[hash:base64:5]',
  enableModernMode: false,
  federation: undefined,
  disableNodePolyfill: false,
  enableTsLoader: false,
};

const serverDefaults: ServerConfig = {
  routes: undefined,
  publicRoutes: undefined,
  ssr: undefined,
  ssrByEntries: undefined,
  baseUrl: '/',
  port: 8080,
};

const devDefaults = { assetPrefix: false, https: false };

const deployDefaults = {
  domain: '',
  domainByEntries: undefined,
};

const toolsDefaults = {
  webpack: undefined,
  babel: undefined,
  postcss: undefined,
  autoprefixer: undefined,
  lodash: undefined,
  devServer: undefined,
  tsLoader: undefined,
  terser: undefined,
  minifyCss: undefined,
};

export const defaults = {
  source: sourceDefaults,
  output: outputDefaults,
  server: serverDefaults,
  dev: devDefaults,
  deploy: deployDefaults,
  tools: toolsDefaults,
  plugins: [],
  runtime: {},
  runtimeByEntries: {},
};
