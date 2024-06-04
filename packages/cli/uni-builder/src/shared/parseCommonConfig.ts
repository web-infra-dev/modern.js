/* eslint-disable max-lines */
/* eslint-disable complexity */
import {
  NODE_MODULES_REGEX,
  RsbuildTarget,
  OverrideBrowserslist,
  getBrowserslist,
  castArray,
  isFunction,
  type HtmlTagHandler,
  type SourceConfig,
} from '@rsbuild/shared';
import {
  mergeRsbuildConfig,
  type RsbuildPlugin,
  type RsbuildConfig,
} from '@rsbuild/core';
import type {
  CreateBuilderCommonOptions,
  UniBuilderConfig,
  DisableSourceMapOption,
} from '../types';
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
import { pluginAntd } from './plugins/antd';
import { pluginArco } from './plugins/arco';
import { pluginSass } from '@rsbuild/plugin-sass';
import { pluginLess } from '@rsbuild/plugin-less';
import { transformToRsbuildServerOptions } from './devServer';

const CSS_MODULES_REGEX = /\.modules?\.\w+$/i;
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

const isUseCssSourceMap = (disableSourceMap: DisableSourceMapOption = {}) => {
  if (typeof disableSourceMap === 'boolean') {
    return !disableSourceMap;
  }

  // If the disableSourceMap.css option is not specified, we will enable it in development mode.
  // We do not need CSS Source Map in production mode.
  if (disableSourceMap.css === undefined) {
    return process.env.NODE_ENV !== 'production';
  }

  return !disableSourceMap.css;
};

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
      disableFilenameHash,
      enableLatestDecorators,
      cssModuleLocalIdentName,
      enableInlineScripts,
      disableCssExtract,
      enableInlineStyles,
      enableCssModuleTSDeclaration,
      disableCssModuleExtension,
      disableTsChecker,
      disableSvgr,
      svgDefaultExport,
      assetsRetry,
      enableAssetFallback,
      enableAssetManifest,
      disableSourceMap,
      convertToRem,
      disableMinimize,
      polyfill,
      dataUriLimit = 10000,
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
      tagsByEntries,
      tags,
      ...htmlConfig
    } = {},
    source: {
      alias,
      globalVars,
      resolveMainFields,
      resolveExtensionPrefix,
      ...sourceConfig
    } = {},
    dev,
    security: { checkSyntax, sri, ...securityConfig } = {},
    tools: { devServer, tsChecker, minifyCss, less, sass, ...toolsConfig } = {},
  } = uniBuilderConfig;

  const rsbuildConfig: RsbuildConfig = {
    plugins,
    output: {
      polyfill: polyfill === 'ua' ? 'off' : polyfill,
      dataUriLimit,
      ...outputConfig,
    },
    source: {
      alias: alias as unknown as SourceConfig['alias'],
      ...sourceConfig,
    },
    performance: performanceConfig,
    html: htmlConfig,
    tools: toolsConfig,
    security: securityConfig,
  };

  const { html = {}, output = {}, source = {} } = rsbuildConfig;

  if (enableLatestDecorators) {
    source.decorators = {
      version: '2022-03',
    };
  }

  if (disableMinimize) {
    output.minify ||= false;
  }

  if (cssModuleLocalIdentName) {
    output.cssModules ||= {};
    output.cssModules.localIdentName = cssModuleLocalIdentName;
  }

  if (isUseCssSourceMap(disableSourceMap)) {
    output.sourceMap ||= {};
    output.sourceMap.css = true;
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

  if (disableFilenameHash !== undefined) {
    output.filenameHash = !disableFilenameHash;
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
    extraConfig.html.templateParameters = (defaultValue, { entryName }) => ({
      ...defaultValue,
      ...(templateParametersByEntries[entryName] || {}),
    });
  }

  if (tags) {
    // The function will be executed at the end of the HTML processing flow
    html.tags = Array.isArray(tags)
      ? tags
          .filter(t => typeof t !== 'function')
          .concat(tags.filter(t => typeof t === 'function'))
      : tags;
  }

  if (tagsByEntries) {
    extraConfig.html.tags = [
      (tags, utils) => {
        const entryTags = castArray(tagsByEntries[utils.entryName]);

        const handlers: HtmlTagHandler[] = [];

        for (const tag of entryTags) {
          if (isFunction(tag)) {
            // The function will be executed at the end of the HTML processing flow
            handlers.push(tag);
          } else {
            tags.push(tag);
          }
        }

        return handlers.reduce(
          (currentTags, handler) => handler(currentTags, utils) || currentTags,
          tags,
        );
      },
    ];
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

  const { dev: RsbuildDev, server } = transformToRsbuildServerOptions(
    dev || {},
    devServer || {},
  );

  rsbuildConfig.server = removeUndefinedKey(server);

  rsbuildConfig.dev = removeUndefinedKey(RsbuildDev);
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
    pluginAntd(),
    pluginArco(),
    pluginSass({
      sassLoaderOptions: sass,
    }),
    pluginLess({
      lessLoaderOptions: less,
    }),
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

  if (enableCssModuleTSDeclaration) {
    const { pluginTypedCSSModules } = await import(
      '@rsbuild/plugin-typed-css-modules'
    );
    rsbuildPlugins.push(pluginTypedCSSModules());
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
        mixedImport: true,
        svgrOptions: {
          exportType: svgDefaultExport === 'component' ? 'default' : 'named',
        },
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

  if (enableAssetManifest) {
    const { pluginManifest } = await import('./plugins/manifest');
    rsbuildPlugins.push(pluginManifest());
  }

  return {
    rsbuildConfig: mergeRsbuildConfig(rsbuildConfig, extraConfig),
    rsbuildPlugins,
  };
}
