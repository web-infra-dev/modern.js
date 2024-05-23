import { MAIN_ENTRY_NAME } from '@modern-js/utils';
import { getAutoInjectEnv } from '../utils/env';
import { IAppContext, AppUserConfig, AppLegacyUserConfig } from '../types';

// Define some default values that are different from rsbuild default config or used in useResolvedConfigContext
export function createDefaultConfig(
  appContext: IAppContext,
): AppUserConfig<'webpack'> | AppUserConfig<'rspack'> {
  const dev: AppUserConfig['dev'] = {
    // `dev.port` should not have a default value
    // because we will use `server.port` by default
    port: undefined,
  };

  const output: AppUserConfig['output'] = {
    distPath: {
      root: 'dist',
      html: 'html',
      js: 'static/js',
      css: 'static/css',
      server: 'bundles',
      worker: 'worker',
    },
    // no need to emit assets for SSR bundles
    emitAssets: ({ target }) => target !== 'node',
    cleanDistPath: true,
    disableNodePolyfill: true,
    enableInlineRouteManifests: true,
    disableInlineRouteManifests: false,
  };

  const source: AppUserConfig['source'] & {
    alias: Record<string, string>;
  } = {
    entries: undefined,
    mainEntryName: MAIN_ENTRY_NAME,
    enableAsyncEntry: false,
    disableDefaultEntries: false,
    entriesDir: './src',
    configDir: './config',
    globalVars: getAutoInjectEnv(appContext),
    alias: {
      [appContext.internalDirAlias]: appContext.internalDirectory,
      [appContext.internalSrcAlias]: appContext.srcDirectory,
      '@': appContext.srcDirectory,
      '@shared': appContext.sharedDirectory,
    },
  };

  const html: AppUserConfig['html'] = {
    title: '',
    mountId: 'root',
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
  };

  const server: AppUserConfig['server'] = {
    routes: undefined,
    publicRoutes: undefined,
    ssr: undefined,
    ssrByEntries: undefined,
    baseUrl: '/',
    port: 8080,
  };

  return {
    source,
    output,
    server,
    dev,
    html,
    tools: {
      tsChecker: {
        issue: {
          exclude: [{ file: '**/api/lambda/**/*' }],
        },
      },
    },
    plugins: [],
    builderPlugins: [],
    runtime: {},
    runtimeByEntries: {},
  };
}

export function createLegacyDefaultConfig(
  appContext: IAppContext,
): AppLegacyUserConfig {
  const defaultAlias: Record<string, string> = appContext
    ? {
        [appContext.internalDirAlias]: appContext.internalDirectory,
        [appContext.internalSrcAlias]: appContext.srcDirectory,
        '@': appContext.srcDirectory,
        '@shared': appContext.sharedDirectory,
      }
    : {};

  const sourceDefaults: AppLegacyUserConfig['source'] = {
    entries: undefined,
    mainEntryName: MAIN_ENTRY_NAME,
    enableAsyncEntry: false,
    disableDefaultEntries: false,
    entriesDir: './src',
    configDir: './config',
    apiDir: './api',
    envVars: [],
    globalVars: getAutoInjectEnv(appContext),
    alias: defaultAlias,
    moduleScopes: undefined,
    include: [],
  };

  const outputDefaults: AppLegacyUserConfig['output'] = {
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
    cssModuleLocalIdentName: undefined,
    disableNodePolyfill: false,
    enableTsLoader: false,
  };

  const serverDefaults: AppLegacyUserConfig['server'] = {
    routes: undefined,
    publicRoutes: undefined,
    ssr: undefined,
    ssrByEntries: undefined,
    baseUrl: '/',
    port: 8080,
  };

  const devDefaults = { assetPrefix: false, https: false };

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

  return {
    source: sourceDefaults,
    output: outputDefaults,
    server: serverDefaults,
    dev: devDefaults,
    tools: toolsDefaults,
    runtime: {},
    runtimeByEntries: {},
  };
}
