import type {
  BuilderConfig,
  WebpackConfig,
  WebpackChain,
} from '@modern-js/builder-webpack-provider';
// FIXME: Remove "@modern-js/builder-webpack-provider/src/types" import
import {
  BabelConfigUtils,
  ModifyWebpackUtils,
} from '@modern-js/builder-webpack-provider/src/types';
import type webpack from '@modern-js/builder-webpack-provider/webpack';
import type {
  NormalizedConfig,
  TerserOptions,
  TransformOptions,
  WebpackConfigUtils,
} from '@modern-js/core';
import { applyOptionsChain, ensureArray } from '@modern-js/utils';

export function createToolsConfig(
  normalizedConfig: NormalizedConfig,
): BuilderConfig['tools'] {
  const {
    disableTsChecker,
    disableCssExtract,
    disableCssModuleExtension,
    enableTsLoader,
  } = normalizedConfig.output;
  const {
    autoprefixer,
    babel,
    minifyCss,
    terser,
    webpack,
    webpackChain,
    tsLoader,
    styledComponents,
    sass,
    postcss,
    less,
    lodash,
  } = normalizedConfig.tools;

  // transform `output.disableCssModuleExtension` => `cssLoader` configuration
  // docs:
  // - https://jupiter.goofy.app/docs/apis/app/config/output/disable-css-module-extension/
  // - https://modernjs.dev/builder/zh/api/config-tools.html#tools-cssloader
  const cssLoader = {
    modules: disableCssModuleExtension
      ? {
          auto: undefined,
        }
      : undefined,
  };

  // TODO: inject lodash into babel
  const builderBabel = createBuilderBabel(babel, lodash);

  // transform modernjs `tools.webpack` => builder `tools.webpack`
  const builderWebpack = createBuilderWebpack(webpack);
  // add defaults value into tools.terser
  const builderTerser = createBuilderTerser(terser);
  const builderWebpackChain = createBuilderWebpackChain(webpackChain);
  const builderTsLoader = createBuilderTsLoader(tsLoader, enableTsLoader);

  return {
    tsChecker: disableTsChecker
      ? false
      : {
          issue: {
            include: [{ file: '**/src/**/*' }],
          },
        },
    styleLoader: disableCssExtract ? {} : undefined,
    autoprefixer,
    babel: builderBabel,
    minifyCss,
    terser: builderTerser,
    cssLoader,
    webpack: builderWebpack,
    webpackChain: builderWebpackChain,
    tsLoader: builderTsLoader,
    styledComponents:
      styledComponents as Required<BuilderConfig>['tools']['styledComponents'],
    sass: sass as Required<BuilderConfig>['tools']['sass'],
    postcss: postcss as Required<BuilderConfig>['tools']['postcss'],
    less: less as Required<BuilderConfig>['tools']['less'],
  };
}

function createBuilderWebpack(webpack: NormalizedConfig['tools']['webpack']) {
  // FIXME: fix any types
  return webpack
    ? (config: WebpackConfig, utils: ModifyWebpackUtils) => {
        const addRules = (
          rules: webpack.RuleSetRule | webpack.RuleSetRule[],
        ) => {
          const ruleArr = ensureArray(rules);
          config.module?.rules?.unshift(...ruleArr);
        };
        const prependPlugins = (
          plugins:
            | webpack.WebpackPluginInstance
            | webpack.WebpackPluginInstance[],
        ) => {
          const pluginArr = ensureArray(plugins);
          config.plugins?.unshift(...pluginArr);
        };
        const appendPlugins = (
          plugins:
            | webpack.WebpackPluginInstance
            | webpack.WebpackPluginInstance[],
        ) => {
          const pluginArr = ensureArray(plugins);
          config.plugins?.push(...pluginArr);
        };
        const removePlugin = (pluginName: string) => {
          config.plugins = config.plugins?.filter(
            p => p.constructor.name !== pluginName,
          );
        };

        return applyOptionsChain<WebpackConfig, any>(config, webpack, {
          env: utils.env,
          webpack: utils.webpack,
          name: utils.target,
          addRules,
          prependPlugins,
          appendPlugins,
          removePlugin,
        } as WebpackConfigUtils);
      }
    : undefined;
}

function createBuilderTerser(terser: NormalizedConfig['tools']['terser']) {
  const defaultTerser: TerserOptions = {
    terserOptions: {
      compress: {
        ecma: 5,
      },
      mangle: { safari10: true },
      // FIXME: ?what devtools commond is --profile?
      // Added for profiling in devtools
      // keep_classnames: isProdProfile(),
      // keep_fnames: isProdProfile(),
      output: {
        ecma: 5,
        ascii_only: true,
      },
    },
  };
  return terser ? applyOptionsChain(defaultTerser, terser) : undefined;
}

function createBuilderWebpackChain(
  webpackChain: NormalizedConfig['tools']['webpackChain'],
) {
  return webpackChain
    ? (chain: WebpackChain, utils: ModifyWebpackUtils) =>
        // FIXME: anytypes
        applyOptionsChain<any, ModifyWebpackUtils>(chain, webpackChain, utils)
    : undefined;
}

function createBuilderTsLoader(
  tsLoader: NormalizedConfig['tools']['tsLoader'],
  enableTsLoader: NormalizedConfig['output']['enableTsLoader'],
) {
  const useTsLoader = Boolean(enableTsLoader);
  if (!useTsLoader) {
    return undefined;
  }
  const defaultTsLoader = {
    compilerOptions: {
      target: 'es5',
      module: 'ESNext',
    },
    transpileOnly: false,
    allowTsInNodeModules: true,
  };
  type TsLoaderUtils = {
    addIncludes: (items: string | RegExp | (string | RegExp)[]) => void;
    addExcludes: (items: string | RegExp | (string | RegExp)[]) => void;
  };
  // FIXME: fix any type
  return (_: any, utils: TsLoaderUtils) =>
    applyOptionsChain<any, TsLoaderUtils>(defaultTsLoader, tsLoader, utils);
}

function createBuilderBabel(
  babel: NormalizedConfig['tools']['babel'],
  lodash: NormalizedConfig['tools']['lodash'],
) {
  return babel || lodash
    ? (config: TransformOptions, utils: BabelConfigUtils) => {
        const lodashConfig = applyOptionsChain<any, any>(
          { id: ['async', 'lodash-bound'] },
          lodash,
        );
        config.plugins?.push(['lodash', lodashConfig]);
        return applyOptionsChain(config, babel || {}, utils);
      }
    : undefined;
}
