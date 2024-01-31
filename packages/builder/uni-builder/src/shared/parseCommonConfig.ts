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
  type SourceConfig,
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

  const {
    plugins: [...plugins] = [],
    performance: { ...performanceConfig } = {},
    output: {
      enableLatestDecorators,
      cssModuleLocalIdentName,
      enableInlineScripts,
      disableCssExtract,
      enableInlineStyles,
      disableCssModuleExtension,
      disableTsChecker,
      disableSvgr,
      svgDefaultExport,
      assetsRetry,
      enableAssetFallback,
      disableSourceMap,
      convertToRem,
      ...outputConfig
    } = {},
    html: {
      disableHtmlFolder,
      metaByEntries,
      titleByEntries,
      faviconByEntries,
      injectByEntries,
      templateByEntries,
      templateParametersByEntries,
      ...htmlConfig
    } = {},
    source: {
      alias,
      globalVars,
      resolveMainFields,
      resolveExtensionPrefix,
      ...sourceConfig
    } = {},
    dev: { port, host, https, ...devConfig } = {},
    security: { checkSyntax, sri, ...securityConfig } = {},
    tools: { devServer, tsChecker, minifyCss, ...toolsConfig } = {},
  } = uniBuilderConfig;

  const rsbuildConfig: RsbuildConfig = {
    plugins,
    output: outputConfig,
    source: {
      alias: alias as unknown as SourceConfig['alias'],
      ...sourceConfig,
    },
    performance: performanceConfig,
    html: htmlConfig,
    tools: toolsConfig,
    dev: devConfig,
    security: securityConfig,
  };

  const { dev = {}, html = {}, output = {}, source = {} } = rsbuildConfig;

  if (enableLatestDecorators) {
    source.decorators = {
      version: '2022-03',
    };
  }

  if (cssModuleLocalIdentName) {
    output.cssModules ||= {};
    output.cssModules.localIdentName = cssModuleLocalIdentName;
  }

  output.distPath ??= {};
  output.distPath.html ??= 'html';
  output.distPath.server ??= 'bundles';

  output.polyfill ??= 'entry';

  if (disableCssModuleExtension) {
    output.cssModules ||= {};
    // priority: output.cssModules.auto -> disableCssModuleExtension
    output.cssModules.auto ??= isLooseCssModules;
  }

  if (enableInlineScripts) {
    output.inlineScripts = enableInlineScripts;
  }

  if (disableCssExtract) {
    output.injectStyles = disableCssExtract;
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

  if (enableInlineStyles) {
    output.inlineStyles = enableInlineStyles;
  }

  const extraConfig: RsbuildConfig = {};
  extraConfig.html ||= {};

  extraConfig.html.outputStructure = disableHtmlFolder ? 'flat' : 'nested';

  if (metaByEntries) {
    extraConfig.html.meta = ({ entryName }) => metaByEntries[entryName];
  }

  html.title ??= '';

  if (titleByEntries) {
    extraConfig.html.title = ({ entryName }) => titleByEntries[entryName];
  }

  if (faviconByEntries) {
    extraConfig.html.favicon = ({ entryName }) => faviconByEntries[entryName];
  }

  if (injectByEntries) {
    extraConfig.html.inject = ({ entryName }) => injectByEntries[entryName];
  }

  if (templateByEntries) {
    extraConfig.html.template = ({ entryName }) => templateByEntries[entryName];
  }

  if (templateParametersByEntries) {
    extraConfig.html.templateParameters = (_, { entryName }) =>
      templateParametersByEntries[entryName];
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

  const newDevServerConfig = mergeChainedOptions({
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
    options: devServer,
    mergeFn: deepmerge,
  });

  dev.writeToDisk = newDevServerConfig.devMiddleware?.writeToDisk;

  dev.hmr = newDevServerConfig.hot;

  dev.client = newDevServerConfig.client;

  dev.liveReload = newDevServerConfig.liveReload;

  const server: ServerConfig = isProd()
    ? {
        publicDir: false,
      }
    : {
        publicDir: false,
        port,
        host,
        https: https ? (https as ServerConfig['https']) : undefined,
      };

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
    pluginGlobalVars(globalVars),
    pluginDevtool({
      disableSourceMap,
    }),
    pluginEmitRouteFile(),
    pluginToml(),
    pluginYaml(),
  ];

  if (checkSyntax) {
    const { pluginCheckSyntax } = await import('@rsbuild/plugin-check-syntax');
    rsbuildPlugins.push(
      pluginCheckSyntax(typeof checkSyntax === 'boolean' ? {} : checkSyntax),
    );
  }

  if (!disableTsChecker) {
    const { pluginTypeCheck } = await import('@rsbuild/plugin-type-check');
    rsbuildPlugins.push(
      pluginTypeCheck({
        forkTsCheckerOptions: tsChecker,
      }),
    );
  }

  if (resolveMainFields) {
    const { pluginMainFields } = await import('./plugins/mainFields');
    rsbuildPlugins.push(pluginMainFields(resolveMainFields));
  }

  if (resolveExtensionPrefix) {
    const { pluginExtensionPrefix } = await import('./plugins/extensionPrefix');
    rsbuildPlugins.push(pluginExtensionPrefix(resolveExtensionPrefix));
  }

  if (convertToRem) {
    const { pluginRem } = await import('@rsbuild/plugin-rem');
    rsbuildPlugins.push(
      pluginRem(typeof convertToRem === 'boolean' ? {} : convertToRem),
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

  if (!disableSvgr) {
    const { pluginSvgr } = await import('@rsbuild/plugin-svgr');
    rsbuildPlugins.push(
      pluginSvgr({
        svgDefaultExport: svgDefaultExport || 'url',
      }),
    );
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
  if (assetsRetry) {
    const { pluginAssetsRetry } = await import('@rsbuild/plugin-assets-retry');
    rsbuildPlugins.push(pluginAssetsRetry(assetsRetry));
  }

  // Note: fallback should be the last plugin
  if (enableAssetFallback) {
    const { pluginFallback } = await import('./plugins/fallback');
    rsbuildPlugins.push(pluginFallback());
  }

  if (frameworkConfigPath) {
    rsbuildPlugins.push(pluginFrameworkConfig(frameworkConfigPath));
  }

  rsbuildPlugins.push(
    pluginCssMinimizer({
      pluginOptions: minifyCss,
    }),
  );

  targets.includes('web') &&
    rsbuildPlugins.push(pluginPostcssLegacy(overrideBrowserslist.web!));

  return {
    rsbuildConfig: mergeRsbuildConfig(rsbuildConfig, extraConfig),
    rsbuildPlugins,
  };
}
