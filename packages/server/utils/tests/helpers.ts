import path from 'path';
import { MAIN_ENTRY_NAME, normalizeOutputPath } from '@modern-js/utils';

const sourceDefaults = {
  entries: undefined,
  mainEntryName: MAIN_ENTRY_NAME,
  disableDefaultEntries: false,
  entriesDir: './src',
  configDir: './config',
  apiDir: './api',
  envVars: [],
  alias: undefined,
  include: [],
};

const outputDefaults = {
  assetPrefix: '/',
  htmlPath: 'html',
  jsPath: 'static/js',
  cssPath: 'static/css',
  mediaPath: 'static/media',
  path: 'dist',
  title: '',
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
  inject: 'head',
  mountId: 'root',
  favicon: '',
  copy: undefined,
  scriptExt: undefined,
  disableCssModuleExtension: false,
  enableCssModuleTSDeclaration: false,
  disableInlineRuntimeChunk: false,
  disableAssetsCache: false,
  polyfill: 'entry',
  dataUriLimit: 10000,
  templateParameters: {},
  federation: undefined,
  enableTsLoader: false,
};

const serverDefaults = {
  routes: undefined,
  publicRoutes: undefined,
  ssr: undefined,
  ssrByEntries: undefined,
  baseUrl: '/',
  port: 8080,
};

const devDefaults = { assetPrefix: false };

const deployDefaults = {
  microFrontend: false,
  domain: '',
  domainByEntries: undefined,
};

const toolsDefaults = {
  postcss: undefined,
  autoprefixer: undefined,
  lodash: undefined,
  devServer: undefined,
  tsLoader: undefined,
  minifyCss: undefined,
};

export const defaults = {
  source: sourceDefaults,
  output: outputDefaults,
  server: serverDefaults,
  dev: devDefaults,
  deploy: deployDefaults,
  tools: toolsDefaults,
};

export const join = (...paths: string[]) => {
  return normalizeOutputPath(path.join(...paths));
};
