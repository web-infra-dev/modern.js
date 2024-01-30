/* eslint-disable max-lines */
/* eslint-disable complexity */
import {
  deepmerge,
  NODE_MODULES_REGEX,
  CSS_MODULES_REGEX,
  isProd,
  ServerConfig,
  RsbuildTarget,
  OverrideBrowserslist,
  getBrowserslist,
  mergeChainedOptions,
} from '@rsbuild/shared';
import {
  mergeRsbuildConfig,
  type RsbuildPlugin,
  type RsbuildConfig,
} from '@rsbuild/core';
import type { CreateBuilderCommonOptions, UniBuilderConfig } from '../types';
import { pluginToml } from '@rsbuild/plugin-toml';
import { pluginYaml } from '@rsbuild/plugin-yaml';
import { pluginReact } from '@rsbuild/plugin-react';
import { pluginGlobalVars } from './plugins/globalVars';
import { pluginRuntimeChunk } from './plugins/runtimeChunk';
import { pluginFrameworkConfig } from './plugins/frameworkConfig';
import { pluginSplitChunks } from './plugins/splitChunk';
import { pluginCssMinimizer } from '@rsbuild/plugin-css-minimizer';
import { pluginPostcssLegacy } from './plugins/postcssLegacy';
import { pluginDevtool } from './plugins/devtools';
import { pluginEmitRouteFile } from './plugins/emitRouteFile';

const GLOBAL_CSS_REGEX = /\.global\.\w+$/;

/** Determine if a file path is a CSS module when disableCssModuleExtension is enabled. */
export const isLooseCssModules = (path: string) => {
  if (NODE_MODULES_REGEX.test(path)) {
    return CSS_MODULES_REGEX.test(path);
  }
  return !GLOBAL_CSS_REGEX.test(path);
};

function removeUndefinedKey(obj: { [key: string]: any }) {
  Object.keys(obj).forEach(key => {
    if (obj[key] === undefined) {
      delete obj[key];
    }
  });

  return obj;
}
const DEFAULT_WEB_BROWSERSLIST = ['> 0.01%', 'not dead', 'not op_mini all'];

const DEFAULT_BROWSERSLIST: Record<RsbuildTarget, string[]> = {
  web: DEFAULT_WEB_BROWSERSLIST,
  node: ['node >= 14'],
  'web-worker': DEFAULT_WEB_BROWSERSLIST,
  'service-worker': DEFAULT_WEB_BROWSERSLIST,
};

async function getBrowserslistWithDefault(
  path: string,
  config: { output?: { overrideBrowserslist?: OverrideBrowserslist } },
  target: RsbuildTarget,
): Promise<string[]> {
  const { overrideBrowserslist: overrides = {} } = config?.output || {};

  if (target === 'web' || target === 'web-worker') {
    if (Array.isArray(overrides)) {
      return overrides;
    }
    if (overrides[target]) {
      return overrides[target]!;
    }

    const browserslistrc = await getBrowserslist(path);
    if (browserslistrc) {
      return browserslistrc;
    }
  }

  if (!Array.isArray(overrides) && overrides[target]) {
    return overrides[target]!;
  }

  return DEFAULT_BROWSERSLIST[target];
}

export async function parseCommonConfig(
  uniBuilderConfig: UniBuilderConfig,
  options: CreateBuilderCommonOptions,
): Promise<{
  rsbuildConfig: RsbuildConfig;
  rsbuildPlugins: RsbuildPlugin[];
}> {
  const { cwd, frameworkConfigPath, entry, target } = options;

  // only deepClone sub config, deepClone all config will cause class instance method undefined
  const rsbuildConfig = (
    [
      'performance',
      'plugins',
      'tools',
      'dev',
      'source',
      'output',
      'html',
      'security',
      'experiments',
    ] as const
  ).reduce<RsbuildConfig & UniBuilderConfig>((obj, key) => {
    const value = uniBuilderConfig[key];
    if (value) {
      // @ts-expect-error
      obj[key] = Array.isArray(value)
        ? [...value]
        : {
            ...value,
          };
    }

    return obj;
  }, {});

  const { dev = {}, html = {}, output = {}, tools = {} } = rsbuildConfig;

  if (output.cssModuleLocalIdentName) {
    output.cssModules ||= {};
    output.cssModules.localIdentName = output.cssModuleLocalIdentName;
    delete output.cssModuleLocalIdentName;
  }

  output.distPath ??= {};
  output.distPath.html ??= 'html';
  output.distPath.server ??= 'bundles';

  output.polyfill ??= 'entry';

  if (output.disableCssModuleExtension) {
    output.cssModules ||= {};
    // priority: output.cssModules.auto -> disableCssModuleExtension
    output.cssModules.auto ??= isLooseCssModules;
    delete output.cssModuleLocalIdentName;
  }

  if (uniBuilderConfig.output?.enableInlineScripts) {
    output.inlineScripts = uniBuilderConfig.output?.enableInlineScripts;
    delete output.enableInlineScripts;
  }

  if (uniBuilderConfig.output?.disableCssExtract) {
    output.injectStyles = uniBuilderConfig.output?.disableCssExtract;
    delete output.disableCssExtract;
  }

  const targets = Array.isArray(target) ? target : [target || 'web'];

  output.targets = targets;

  const overrideBrowserslist: OverrideBrowserslist = {};

  for (const target of targets) {
    // Incompatible with the scenario where target contains both 'web' and 'modern-web'
    overrideBrowserslist[target] = await getBrowserslistWithDefault(
      cwd,
      uniBuilderConfig,
      target,
    );
  }
  output.overrideBrowserslist = overrideBrowserslist;

  if (uniBuilderConfig.output?.enableInlineStyles) {
    output.inlineStyles = uniBuilderConfig.output?.enableInlineStyles;
    delete output.enableInlineStyles;
  }

  const extraConfig: RsbuildConfig = {};
  extraConfig.html ||= {};

  extraConfig.html.outputStructure = html.disableHtmlFolder ? 'flat' : 'nested';
  delete html.disableHtmlFolder;

  if (uniBuilderConfig.html?.metaByEntries) {
    extraConfig.html.meta = ({ entryName }) =>
      uniBuilderConfig.html!.metaByEntries![entryName];
    delete html.metaByEntries;
  }

  html.title ??= '';

  if (uniBuilderConfig.html?.titleByEntries) {
    extraConfig.html.title = ({ entryName }) =>
      uniBuilderConfig.html!.titleByEntries![entryName];
    delete html.titleByEntries;
  }

  if (uniBuilderConfig.html?.faviconByEntries) {
    extraConfig.html.favicon = ({ entryName }) =>
      uniBuilderConfig.html!.faviconByEntries![entryName];
    delete html.faviconByEntries;
  }

  if (uniBuilderConfig.html?.injectByEntries) {
    extraConfig.html.inject = ({ entryName }) =>
      uniBuilderConfig.html!.injectByEntries![entryName];
    delete html.injectByEntries;
  }

  if (uniBuilderConfig.html?.templateByEntries) {
    extraConfig.html.template = ({ entryName }) =>
      uniBuilderConfig.html!.templateByEntries![entryName];
    delete html.templateByEntries;
  }

  if (uniBuilderConfig.html?.templateParametersByEntries) {
    extraConfig.html.templateParameters = (_, { entryName }) =>
      uniBuilderConfig.html!.templateParametersByEntries![entryName];
    delete html.templateParametersByEntries;
  }

  extraConfig.tools ??= {};

  // compat template title and meta params
  extraConfig.tools.htmlPlugin = config => {
    if (typeof config.templateParameters === 'function') {
      const originFn = config.templateParameters;

      config.templateParameters = (...args) => {
        const res = originFn(...args);
        return {
          title: config.title,
          meta: undefined,
          ...res,
        };
      };
    }
  };

  // more dev & server config will compat in modern-js/server

  // enable progress bar by default
  if (dev.progressBar === undefined) {
    dev.progressBar = true;
  }

  const devServer = mergeChainedOptions({
    defaults: {
      devMiddleware: {
        writeToDisk: (file: string) => !file.includes('.hot-update.'),
      },
      hot: dev?.hmr ?? true,
      liveReload: true,
      client: {
        path: '/webpack-hmr',
      },
    },
    options: tools.devServer,
    mergeFn: deepmerge,
  });

  dev.writeToDisk = devServer.devMiddleware?.writeToDisk;

  dev.hmr = devServer.hot;

  dev.client = devServer.client;

  dev.liveReload = devServer.liveReload;

  const server: ServerConfig = isProd()
    ? {
        publicDir: false,
      }
    : {
        publicDir: false,
        port: dev.port,
        host: dev.host,
        https: dev.https ? (dev.https as ServerConfig['https']) : undefined,
      };

  delete tools.devServer;
  delete dev.https;
  delete dev.port;
  delete dev.host;

  rsbuildConfig.server = removeUndefinedKey(server);

  rsbuildConfig.dev = removeUndefinedKey(dev);
  rsbuildConfig.html = html;
  rsbuildConfig.output = output;

  if (entry) {
    rsbuildConfig.source ??= {};
    rsbuildConfig.source.entry = entry;
  }

  const rsbuildPlugins: RsbuildPlugin[] = [
    pluginSplitChunks(),
    pluginGlobalVars(uniBuilderConfig.source?.globalVars),
    pluginDevtool({
      disableSourceMap: uniBuilderConfig.output?.disableSourceMap,
    }),
    pluginEmitRouteFile(),
    pluginToml(),
    pluginYaml(),
  ];

  const checkSyntaxOptions = uniBuilderConfig.security?.checkSyntax;

  if (checkSyntaxOptions) {
    const { pluginCheckSyntax } = await import('@rsbuild/plugin-check-syntax');
    rsbuildPlugins.push(
      pluginCheckSyntax(
        typeof checkSyntaxOptions === 'boolean' ? {} : checkSyntaxOptions,
      ),
    );
  }

  if (!uniBuilderConfig.output?.disableTsChecker) {
    const { pluginTypeCheck } = await import('@rsbuild/plugin-type-check');
    rsbuildPlugins.push(
      pluginTypeCheck({
        forkTsCheckerOptions: uniBuilderConfig.tools?.tsChecker,
      }),
    );

    delete output.disableTsChecker;
    delete tools.tsChecker;
  }

  if (uniBuilderConfig.source?.resolveMainFields) {
    const { pluginMainFields } = await import('./plugins/mainFields');
    rsbuildPlugins.push(
      pluginMainFields(uniBuilderConfig.source?.resolveMainFields),
    );
  }

  if (uniBuilderConfig.source?.resolveExtensionPrefix) {
    const { pluginExtensionPrefix } = await import('./plugins/extensionPrefix');
    rsbuildPlugins.push(
      pluginExtensionPrefix(uniBuilderConfig.source?.resolveExtensionPrefix),
    );
  }

  const remOptions = uniBuilderConfig.output?.convertToRem;
  if (remOptions) {
    const { pluginRem } = await import('@rsbuild/plugin-rem');
    rsbuildPlugins.push(
      pluginRem(typeof remOptions === 'boolean' ? {} : remOptions),
    );
  }

  rsbuildPlugins.push(
    pluginRuntimeChunk(uniBuilderConfig.output?.disableInlineRuntimeChunk),
  );

  const { sourceBuild } = uniBuilderConfig.experiments || {};
  if (sourceBuild) {
    const { pluginSourceBuild } = await import('@rsbuild/plugin-source-build');

    rsbuildPlugins.push(
      pluginSourceBuild(sourceBuild === true ? {} : sourceBuild),
    );
  }

  rsbuildPlugins.push(pluginReact());

  if (!uniBuilderConfig.output?.disableSvgr) {
    const { pluginSvgr } = await import('@rsbuild/plugin-svgr');
    rsbuildPlugins.push(
      pluginSvgr({
        svgDefaultExport: uniBuilderConfig.output?.svgDefaultExport || 'url',
      }),
    );

    delete output.disableSvgr;
    delete output.svgDefaultExport;
  }

  const pugOptions = uniBuilderConfig.tools?.pug;
  if (pugOptions) {
    const { pluginPug } = await import('@rsbuild/plugin-pug');
    rsbuildPlugins.push(
      pluginPug(
        typeof pugOptions === 'boolean'
          ? {}
          : {
              pugOptions,
            },
      ),
    );
  }

  // assetsRetry inject should be later
  if (uniBuilderConfig.output?.assetsRetry) {
    const { pluginAssetsRetry } = await import('@rsbuild/plugin-assets-retry');
    rsbuildPlugins.push(
      pluginAssetsRetry(uniBuilderConfig.output?.assetsRetry),
    );
  }

  // Note: fallback should be the last plugin
  if (uniBuilderConfig.output?.enableAssetFallback) {
    const { pluginFallback } = await import('./plugins/fallback');
    rsbuildPlugins.push(pluginFallback());
  }

  if (frameworkConfigPath) {
    rsbuildPlugins.push(pluginFrameworkConfig(frameworkConfigPath));
  }

  rsbuildPlugins.push(
    pluginCssMinimizer({
      pluginOptions: uniBuilderConfig.tools?.minifyCss,
    }),
  );

  targets.includes('web') &&
    rsbuildPlugins.push(pluginPostcssLegacy(overrideBrowserslist.web!));

  return {
    rsbuildConfig: mergeRsbuildConfig(rsbuildConfig, extraConfig),
    rsbuildPlugins,
  };
}
