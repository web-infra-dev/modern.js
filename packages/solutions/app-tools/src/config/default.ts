import { MAIN_ENTRY_NAME } from '@modern-js/utils';
import type { AppLegacyUserConfig, AppUserConfig } from '../types';
import type { AppToolsContext } from '../types/new';
import { getAutoInjectEnv } from '../utils/env';

// Define some default values that are different from rsbuild default config or used in useResolvedConfigContext
export function createDefaultConfig(
  appContext: AppToolsContext<'shared'>,
): AppUserConfig<'webpack'> | AppUserConfig<'rspack'> {
  const dev: AppUserConfig['dev'] = {
    // `dev.port` should not have a default value
    // because we will use `server.port` by default
    port: undefined,
    cliShortcuts: {
      help: false,
      // does not support restart server and print urls yet
      custom: (shortcuts = []) =>
        shortcuts.filter(({ key }) => key !== 'r' && key !== 'u'),
    },
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
    enableCustomEntry: false,
    disableDefaultEntries: false,
    entriesDir: './src',
    configDir: './config',
    globalVars: getAutoInjectEnv(appContext),
    alias: {},
  };

  const resolve: AppUserConfig['resolve'] = {
    alias: {
      [appContext.internalDirAlias]: appContext.internalDirectory,
      [appContext.internalSrcAlias]: appContext.srcDirectory!,
      '@': appContext.srcDirectory!,
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
    resolve,
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
  appContext: AppToolsContext<'shared'>,
): AppLegacyUserConfig {
  const defaultAlias: Record<string, string> = appContext
    ? {
        [appContext.internalDirAlias]: appContext.internalDirectory,
        [appContext.internalSrcAlias]: appContext.srcDirectory!,
        '@': appContext.srcDirectory!,
        '@shared': appContext.sharedDirectory,
      }
    : {};

  const sourceDefaults: AppLegacyUserConfig['source'] = {
    entries: undefined,
    mainEntryName: MAIN_ENTRY_NAME,
    enableAsyncEntry: false,
    enableCustomEntry: false,
    disableDefaultEntries: false,
    entriesDir: './src',
    configDir: './config',
    apiDir: './api',
    envVars: [],
    globalVars: getAutoInjectEnv(appContext),
    alias: defaultAlias,
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
