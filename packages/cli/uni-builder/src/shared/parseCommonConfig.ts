import { isFunction } from '@modern-js/utils';
import {
  type HtmlTagHandler,
  type RsbuildConfig,
  type RsbuildPlugin,
  type SourceConfig,
  type ToolsConfig,
  mergeRsbuildConfig,
} from '@rsbuild/core';
import { pluginCssMinimizer } from '@rsbuild/plugin-css-minimizer';
import { pluginLess } from '@rsbuild/plugin-less';
import { pluginReact } from '@rsbuild/plugin-react';
import { pluginSass } from '@rsbuild/plugin-sass';
import { pluginToml } from '@rsbuild/plugin-toml';
import { pluginYaml } from '@rsbuild/plugin-yaml';
import type {
  CreateBuilderCommonOptions,
  DisableSourceMapOption,
  UniBuilderConfig,
} from '../types';
import { transformToRsbuildServerOptions } from './devServer';
import { pluginAntd } from './plugins/antd';
import { pluginArco } from './plugins/arco';
import { pluginDevtool } from './plugins/devtools';
import { pluginEmitRouteFile } from './plugins/emitRouteFile';
import { pluginEnvironmentDefaults } from './plugins/environmentDefaults';
import { pluginFrameworkConfig } from './plugins/frameworkConfig';
import { pluginGlobalVars } from './plugins/globalVars';
import { pluginHtmlMinifierTerser } from './plugins/htmlMinify';
import { pluginPostcss } from './plugins/postcss';
import { pluginRuntimeChunk } from './plugins/runtimeChunk';
import { pluginSplitChunks } from './plugins/splitChunk';
import { NODE_MODULES_REGEX, castArray } from './utils';

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
  const { frameworkConfigPath } = options;

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
      distPath = {},
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
      appIcon,
      tags,
      ...htmlConfig
    } = {},
    source: {
      alias,
      globalVars,
      resolveMainFields,
      resolveExtensionPrefix,
      transformImport,
      ...sourceConfig
    } = {},
    dev,
    security: { checkSyntax, sri, ...securityConfig } = {},
    tools: {
      devServer,
      tsChecker,
      minifyCss,
      less,
      sass,
      htmlPlugin,
      autoprefixer,
      ...toolsConfig
    } = {},
    environments = {},
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
    environments,
  };

  rsbuildConfig.tools!.htmlPlugin = htmlPlugin as ToolsConfig['htmlPlugin'];

  rsbuildConfig.tools!.lightningcssLoader ??= false;

  const { html = {}, output = {}, source = {} } = rsbuildConfig;

  source.transformImport =
    transformImport === false ? () => [] : transformImport;

  if (enableLatestDecorators) {
    source.decorators = {
      version: '2022-03',
    };
  } else {
    source.decorators ??= {
      version: 'legacy',
    };
  }

  output.charset ??= 'ascii';

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

  const { server: _server, worker, ...rsbuildDistPath } = distPath;

  output.distPath = rsbuildDistPath;
  output.distPath.html ??= 'html';

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

  html.appIcon =
    typeof appIcon === 'string'
      ? { icons: [{ src: appIcon, size: 180 }] }
      : appIcon;

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

  const rsbuildPlugins: RsbuildPlugin[] = [
    pluginSplitChunks(),
    pluginGlobalVars(globalVars),
    pluginDevtool({
      disableSourceMap,
    }),
    pluginEmitRouteFile(),
    pluginToml(),
    pluginYaml(),
    pluginAntd(transformImport),
    pluginArco(transformImport),
    pluginSass({
      sassLoaderOptions: sass,
    }),
    pluginLess({
      lessLoaderOptions: less,
    }),
    pluginEnvironmentDefaults(distPath),
    pluginHtmlMinifierTerser(),
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

  rsbuildPlugins.push(
    pluginPostcss({
      autoprefixer,
    }),
  );

  if (enableAssetManifest) {
    const { pluginManifest } = await import('./plugins/manifest');
    rsbuildPlugins.push(pluginManifest());
  }

  return {
    rsbuildConfig: mergeRsbuildConfig(rsbuildConfig, extraConfig),
    rsbuildPlugins,
  };
}
