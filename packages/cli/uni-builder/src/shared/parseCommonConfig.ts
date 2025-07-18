import {
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
import { pluginGlobalVars } from './plugins/globalVars';
import { pluginHtmlMinifierTerser } from './plugins/htmlMinify';
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
  options?: CreateBuilderCommonOptions,
): Promise<{
  rsbuildConfig: RsbuildConfig;
  rsbuildPlugins: RsbuildPlugin[];
}> {
  const frameworkConfigPath = options?.frameworkConfigPath;

  const {
    plugins: [...plugins] = [],
    performance: { ...performanceConfig } = {},
    output: {
      disableFilenameHash,
      enableLatestDecorators,
      enableInlineScripts,
      disableCssExtract,
      enableInlineStyles,
      enableCssModuleTSDeclaration,
      disableCssModuleExtension,
      disableTsChecker,
      disableSvgr,
      svgDefaultExport,
      assetsRetry,
      enableAssetManifest,
      disableSourceMap,
      sourceMap,
      convertToRem,
      disableMinimize,
      polyfill,
      dataUriLimit = 10000,
      distPath = {},
      ...outputConfig
    } = {},
    html: { disableHtmlFolder, outputStructure, appIcon, ...htmlConfig } = {},
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
    resolve = {},
  } = uniBuilderConfig;

  const rsbuildConfig: RsbuildConfig = {
    plugins,
    output: {
      polyfill: polyfill === 'ua' ? 'off' : polyfill,
      dataUriLimit,
      sourceMap,
      ...outputConfig,
    },
    resolve,
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

  /**
   * 在老版本中，默认 source.alias 为空对象。Rsbuild 新版本推荐使用 resolve.alias 代替 source.alias
   * 因此如果 alias 为空对象，则删除 source.alias，避免在默认情况下出现警告
   */
  if (typeof alias === 'object' && Object.keys(alias).length === 0) {
    delete rsbuildConfig.source?.alias;
  }

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

  if (isUseCssSourceMap(disableSourceMap) && output.sourceMap !== true) {
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
    output.injectStyles ??= disableCssExtract;
  }

  if (enableInlineStyles) {
    output.inlineStyles = enableInlineStyles;
  }

  if (disableFilenameHash !== undefined) {
    output.filenameHash = !disableFilenameHash;
  }

  const extraConfig: RsbuildConfig = {};
  extraConfig.html ||= {};

  extraConfig.html.outputStructure =
    outputStructure ?? (disableHtmlFolder ? 'flat' : 'nested');

  html.title ??= '';

  html.appIcon =
    typeof appIcon === 'string'
      ? { icons: [{ src: appIcon, size: 180 }] }
      : appIcon;

  extraConfig.tools ??= {};

  if (htmlPlugin !== false) {
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
  }

  const { rsbuildDev, rsbuildServer } = transformToRsbuildServerOptions(
    dev || {},
    devServer || {},
  );

  rsbuildConfig.server = removeUndefinedKey(rsbuildServer);
  rsbuildConfig.dev = removeUndefinedKey(rsbuildDev);
  rsbuildConfig.html = html;
  rsbuildConfig.output = output;

  const rsbuildPlugins: RsbuildPlugin[] = [
    pluginSplitChunks(),
    pluginGlobalVars(globalVars),
    pluginDevtool({
      disableSourceMap,
      sourceMap,
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
        tsCheckerOptions: tsChecker,
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

  // assetsRetry inject should be later
  if (assetsRetry) {
    const { pluginAssetsRetry } = await import('@rsbuild/plugin-assets-retry');
    rsbuildPlugins.push(pluginAssetsRetry(assetsRetry));
  }

  if (frameworkConfigPath && performanceConfig.buildCache !== false) {
    const buildCache =
      typeof performanceConfig.buildCache === 'object'
        ? performanceConfig.buildCache
        : {};
    rsbuildConfig.performance!.buildCache = {
      ...buildCache,
      buildDependencies: [
        frameworkConfigPath,
        ...(buildCache.buildDependencies || []),
      ],
    };
  }

  rsbuildPlugins.push(
    pluginCssMinimizer({
      pluginOptions: minifyCss,
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
