import type { CliUserConfig, IAppContext } from '@modern-js/core';
import type { AppTools } from '../types';

export function createDefaultConfig(
  appContext: IAppContext,
): CliUserConfig<AppTools> {
  const defaultAlias: Record<string, string> = appContext
    ? {
        [appContext.internalDirAlias]: appContext.internalDirectory,
        [appContext.internalSrcAlias]: appContext.srcDirectory,
        '@': appContext.srcDirectory,
        '@shared': appContext.sharedDirectory,
      }
    : {};
  const source: CliUserConfig<AppTools>['source'] = {
    entries: undefined,
    enableAsyncEntry: false,
    disableDefaultEntries: false,
    entriesDir: './src',
    configDir: './config',
    globalVars: undefined,
    moduleScopes: undefined,
    include: [],
    alias: defaultAlias,
  };
  const output: CliUserConfig<AppTools>['output'] = {
    assetPrefix: '/',
    distPath: {
      html: 'html',
      js: 'static/js',
      css: 'static/css',
      media: 'static/media',
      root: 'dist',
    },
    copy: undefined,
    disableCssModuleExtension: false,
    enableCssModuleTSDeclaration: false,
    disableMinimize: false,
    enableInlineStyles: false,
    enableInlineScripts: false,
    disableSourceMap: false,
    disableInlineRuntimeChunk: false,
    disableFilenameHash: false,
    enableLatestDecorators: false,
    polyfill: 'entry',
    dataUriLimit: 10000,
    cssModuleLocalIdentName: undefined,
  };
  const html: CliUserConfig<AppTools>['html'] = {
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
    disableHtmlFolder: false,
    templateParameters: {},
    templateParametersByEntries: undefined,
  };
  const server: CliUserConfig<AppTools>['server'] = {
    routes: undefined,
    publicRoutes: undefined,
    ssr: undefined,
    ssrByEntries: undefined,
    baseUrl: '/',
    port: 8080,
  };
  const dev: CliUserConfig<AppTools>['dev'] = {
    assetPrefix: false,
    https: false,
  };
  const tools: CliUserConfig<AppTools>['tools'] = {
    webpack: undefined,
    babel: undefined,
    postcss: undefined,
    autoprefixer: undefined,
    devServer: undefined,
    tsLoader: undefined,
    terser: undefined,
    minifyCss: undefined,
  };

  return {
    source,
    output,
    server,
    dev,
    html,
    tools,
    plugins: [],
    runtime: {},
    runtimeByEntries: {},
  };
}
