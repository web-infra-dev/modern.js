import {
  type RsbuildConfig,
  type RsbuildPlugin,
  type ToolsConfig,
  mergeRsbuildConfig,
} from '@rsbuild/core';
import { pluginCssMinimizer } from '@rsbuild/plugin-css-minimizer';
import { pluginLess } from '@rsbuild/plugin-less';
import { pluginReact } from '@rsbuild/plugin-react';
import { pluginSass } from '@rsbuild/plugin-sass';
import { pluginDevtool } from '../plugins/devtools';
import { pluginEmitRouteFile } from '../plugins/emitRouteFile';
import { pluginEnvironmentDefaults } from '../plugins/environmentDefaults';
import { pluginGlobalVars } from '../plugins/globalVars';
import { pluginHtmlMinifierTerser } from '../plugins/htmlMinify';
import { pluginRuntimeChunk } from '../plugins/runtimeChunk';
import type { BuilderConfig, CreateBuilderCommonOptions } from '../types';
import { transformToRsbuildServerOptions } from './devServer';
import { NODE_MODULES_REGEX } from './utils';

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

export async function parseCommonConfig(
  builderConfig: BuilderConfig,
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
      enableCssModuleTSDeclaration,
      disableCssModuleExtension,
      disableTsChecker,
      disableSvgr,
      svgDefaultExport,
      assetsRetry,
      enableAssetManifest,
      sourceMap,
      convertToRem,
      polyfill,
      dataUriLimit = 10000,
      distPath = {},
      ...outputConfig
    } = {},
    html: { outputStructure, appIcon, ...htmlConfig } = {},
    source: { globalVars, transformImport, ...sourceConfig } = {},
    dev = {},
    server = {},
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
  } = builderConfig;

  const rsbuildConfig: RsbuildConfig = {
    plugins,
    output: {
      polyfill: polyfill === 'ua' ? 'off' : polyfill,
      dataUriLimit,
      sourceMap,
      ...outputConfig,
    },
    resolve,
    source: sourceConfig,
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

  if (!source.decorators) {
    source.decorators = {
      version: 'legacy',
    };
  }

  output.charset ??= 'ascii';

  /**
   * The default value in Rsbuild of `sourceMap.css` is `false` in development mode
   * In Modern.js, we need to set it to `true` if user not set it
   */
  if (typeof output.sourceMap !== 'boolean') {
    output.sourceMap ||= {};
    output.sourceMap.css ??= process.env.NODE_ENV !== 'production';
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

  const extraConfig: RsbuildConfig = {};
  extraConfig.html ||= {};

  extraConfig.html.outputStructure = outputStructure ?? 'nested';

  html.title ??= '';

  html.appIcon = appIcon;

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

  if (!dev.lazyCompilation) {
    dev.lazyCompilation = false;
  }

  const { rsbuildDev, rsbuildServer } = transformToRsbuildServerOptions(
    dev || {},
    devServer || {},
    server || {},
  );

  rsbuildConfig.server = removeUndefinedKey(rsbuildServer);
  rsbuildConfig.dev = removeUndefinedKey(rsbuildDev);
  rsbuildConfig.html = html;
  rsbuildConfig.output = output;

  const rsbuildPlugins: RsbuildPlugin[] = [
    pluginGlobalVars(globalVars),
    pluginDevtool({
      sourceMap,
    }),
    pluginEmitRouteFile(),
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
    pluginRuntimeChunk(builderConfig.output?.disableInlineRuntimeChunk),
  );

  const { sourceBuild } = builderConfig.experiments || {};
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
    const { pluginManifest } = await import('../plugins/manifest');
    rsbuildPlugins.push(pluginManifest());
  }

  return {
    rsbuildConfig: mergeRsbuildConfig(rsbuildConfig, extraConfig),
    rsbuildPlugins,
  };
}
