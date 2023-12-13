import {
  deepmerge,
  NODE_MODULES_REGEX,
  CSS_MODULES_REGEX,
  isProd,
  ServerConfig,
  logger,
  color,
  RsbuildTarget,
  OverrideBrowserslist,
  getBrowserslist,
} from '@rsbuild/shared';
import {
  mergeRsbuildConfig,
  type RsbuildPlugin,
  type RsbuildConfig,
} from '@rsbuild/core';
import type {
  UniBuilderRspackConfig,
  UniBuilderWebpackConfig,
  DevServerHttpsOptions,
} from '../types';
import { pluginRem } from '@rsbuild/plugin-rem';
import { pluginPug } from '@rsbuild/plugin-pug';
import { pluginAssetsRetry } from '@rsbuild/plugin-assets-retry';
import { pluginTypeCheck } from '@rsbuild/plugin-type-check';
import { pluginReact } from '@rsbuild/plugin-react';
import { pluginFallback } from './plugins/fallback';
import { pluginGlobalVars } from './plugins/globalVars';
import { pluginRuntimeChunk } from './plugins/runtimeChunk';
import { pluginFrameworkConfig } from './plugins/frameworkConfig';
import { pluginMainFields } from './plugins/mainFields';
import { pluginExtensionPrefix } from './plugins/extensionPrefix';
import { pluginSplitChunks } from './plugins/splitChunk';
import { pluginSvgr } from '@rsbuild/plugin-svgr';
import { pluginCheckSyntax } from '@rsbuild/plugin-check-syntax';
import { pluginCssMinimizer } from '@rsbuild/plugin-css-minimizer';
import { pluginPostcssLegacy } from './plugins/postcssLegacy';
import { pluginDevtool } from './plugins/devtools';

const GLOBAL_CSS_REGEX = /\.global\.\w+$/;

/** Determine if a file path is a CSS module when disableCssModuleExtension is enabled. */
export const isLooseCssModules = (path: string) => {
  if (NODE_MODULES_REGEX.test(path)) {
    return CSS_MODULES_REGEX.test(path);
  }
  return !GLOBAL_CSS_REGEX.test(path);
};

const genHttpsOptions = async (
  userOptions: DevServerHttpsOptions,
  cwd: string,
): Promise<{
  key: string;
  cert: string;
}> => {
  const httpsOptions: { key?: string; cert?: string } =
    typeof userOptions === 'boolean' ? {} : userOptions;

  if (!httpsOptions.key || !httpsOptions.cert) {
    let devcertPath: string;

    try {
      devcertPath = require.resolve('devcert', { paths: [cwd, __dirname] });
    } catch (err) {
      const command = color.bold(color.yellow(`npm add devcert@1.2.2 -D`));
      logger.error(
        `You have enabled "dev.https" option, but the "devcert" package is not installed.`,
      );
      logger.error(
        `Please run ${command} to install manually, otherwise the https can not work.`,
      );
      throw new Error('[https] "devcert" is not found.');
    }

    const devcert = require(devcertPath);
    const selfsign = await devcert.certificateFor(['localhost']);
    return selfsign;
  }

  return httpsOptions as { key: string; cert: string };
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

export async function parseCommonConfig<B = 'rspack' | 'webpack'>(
  uniBuilderConfig: B extends 'rspack'
    ? UniBuilderRspackConfig
    : UniBuilderWebpackConfig,
  cwd: string,
  frameworkConfigPath?: string,
): Promise<{
  rsbuildConfig: RsbuildConfig;
  rsbuildPlugins: RsbuildPlugin[];
}> {
  const rsbuildConfig = deepmerge({}, uniBuilderConfig);
  const { dev = {}, html = {}, output = {}, tools = {} } = rsbuildConfig;

  // enable progress bar by default
  if (dev.progressBar === undefined) {
    dev.progressBar = true;
  }

  if (output.cssModuleLocalIdentName) {
    output.cssModules ||= {};
    output.cssModules.localIdentName = output.cssModuleLocalIdentName;
    delete output.cssModuleLocalIdentName;
  }

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

  const targets = uniBuilderConfig.output?.targets || ['web'];
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

  if (html.metaByEntries) {
    extraConfig.html.meta = ({ entryName }) => html.metaByEntries![entryName];
    delete html.metaByEntries;
  }

  if (html.titleByEntries) {
    extraConfig.html.title = ({ entryName }) => html.titleByEntries![entryName];
    delete html.titleByEntries;
  }

  if (html.faviconByEntries) {
    extraConfig.html.favicon = ({ entryName }) =>
      html.faviconByEntries![entryName];
    delete html.faviconByEntries;
  }

  if (html.injectByEntries) {
    extraConfig.html.inject = ({ entryName }) =>
      html.injectByEntries![entryName];
    delete html.injectByEntries;
  }

  if (html.templateByEntries) {
    extraConfig.html.template = ({ entryName }) =>
      html.templateByEntries![entryName];
    delete html.templateByEntries;
  }

  if (html.templateParametersByEntries) {
    extraConfig.html.templateParameters = (_, { entryName }) =>
      html.templateParametersByEntries![entryName];
    delete html.templateParametersByEntries;
  }

  const server: ServerConfig = isProd()
    ? {
        publicDir: false,
      }
    : {
        https:
          tools.devServer?.https || dev.https
            ? await genHttpsOptions((tools.devServer?.https || dev.https)!, cwd)
            : undefined,
        port: dev.port,
        host: dev.host,
        compress: tools.devServer?.compress,
        headers: tools.devServer?.headers,
        historyApiFallback: tools.devServer?.historyApiFallback,
        proxy: tools.devServer?.proxy,
        publicDir: false,
      };

  dev.client = tools.devServer?.client;
  dev.writeToDisk = tools.devServer?.devMiddleware?.writeToDisk ?? true;

  if (tools.devServer?.hot === false) {
    dev.hmr = false;
  }

  if (tools.devServer?.before?.length || tools.devServer?.after?.length) {
    dev.setupMiddlewares = [
      ...(tools.devServer?.setupMiddlewares || []),
      middlewares => {
        // the order: devServer.before => setupMiddlewares.unshift => internal middlewares => setupMiddlewares.push => devServer.after.
        middlewares.unshift(...(tools.devServer?.before || []));

        middlewares.push(...(tools.devServer?.after || []));
      },
    ];
  } else if (tools.devServer?.setupMiddlewares) {
    dev.setupMiddlewares = tools.devServer?.setupMiddlewares;
  }

  delete tools.devServer;
  delete dev.https;
  delete dev.port;
  delete dev.host;

  rsbuildConfig.server = removeUndefinedKey(server);

  rsbuildConfig.dev = removeUndefinedKey(dev);
  rsbuildConfig.html = html;
  rsbuildConfig.output = output;

  const rsbuildPlugins: RsbuildPlugin[] = [
    pluginSplitChunks(),
    pluginGlobalVars(uniBuilderConfig.source?.globalVars),
    pluginDevtool({
      disableSourceMap: uniBuilderConfig.output?.disableSourceMap,
    }),
  ];

  const checkSyntaxOptions = uniBuilderConfig.security?.checkSyntax;

  if (checkSyntaxOptions) {
    rsbuildPlugins.push(
      pluginCheckSyntax(
        typeof checkSyntaxOptions === 'boolean' ? {} : checkSyntaxOptions,
      ),
    );
  }

  if (!uniBuilderConfig.output?.disableTsChecker) {
    rsbuildPlugins.push(
      pluginTypeCheck({
        forkTsCheckerOptions: uniBuilderConfig.tools?.tsChecker,
      }),
    );

    delete output.disableTsChecker;
    delete tools.tsChecker;
  }

  if (!uniBuilderConfig.output?.disableSvgr) {
    rsbuildPlugins.push(
      pluginSvgr({
        svgDefaultExport: uniBuilderConfig.output?.svgDefaultExport,
      }),
    );

    delete output.disableSvgr;
    delete output.svgDefaultExport;
  }

  if (uniBuilderConfig.source?.resolveMainFields) {
    rsbuildPlugins.push(
      pluginMainFields(uniBuilderConfig.source?.resolveMainFields),
    );
  }

  if (uniBuilderConfig.source?.resolveExtensionPrefix) {
    rsbuildPlugins.push(
      pluginExtensionPrefix(uniBuilderConfig.source?.resolveExtensionPrefix),
    );
  }

  if (uniBuilderConfig.output?.assetsRetry) {
    rsbuildPlugins.push(
      pluginAssetsRetry(uniBuilderConfig.output?.assetsRetry),
    );
  }

  const remOptions = uniBuilderConfig.output?.convertToRem;
  if (remOptions) {
    rsbuildPlugins.push(
      pluginRem(typeof remOptions === 'boolean' ? {} : remOptions),
    );
  }

  if (!uniBuilderConfig.output?.disableInlineRuntimeChunk) {
    rsbuildPlugins.push(pluginRuntimeChunk());
  }

  if (uniBuilderConfig.experiments?.sourceBuild) {
    const { pluginSourceBuild } = await import('@rsbuild/plugin-source-build');

    rsbuildPlugins.push(pluginSourceBuild());
  }

  rsbuildPlugins.push(pluginReact());

  const pugOptions = uniBuilderConfig.tools?.pug;
  if (pugOptions) {
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

  // Note: fallback should be the last plugin
  if (uniBuilderConfig.output?.enableAssetFallback) {
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
