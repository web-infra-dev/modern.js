import type {
  BuilderConfig,
  WebpackConfig,
  WebpackChain,
} from '@modern-js/builder-webpack-provider';
import type webpack from '@modern-js/builder-webpack-provider/webpack';
import type { NormalizedConfig, WebpackConfigUtils } from '@modern-js/core';
import { applyOptionsChain, ensureArray } from '@modern-js/utils';

export function createToolsConfig(
  normalizedConfig: NormalizedConfig,
): BuilderConfig['tools'] {
  const { disableCssExtract, disableCssModuleExtension, enableTsLoader } =
    normalizedConfig.output;
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

  // TODO: need realize in builder
  // transform `output.disableCssModuleExtension` => `cssLoader` configuration
  const cssLoader = {
    modules: disableCssModuleExtension
      ? {
          auto: undefined,
        }
      : undefined,
  };

  const builderBabel = createBuilderBabel(babel, lodash);
  // transform modernjs `tools.webpack` => builder `tools.webpack`
  const builderWebpack = createBuilderWebpack(webpack);
  // add defaults value into tools.terser
  const builderWebpackChain = createBuilderWebpackChain(webpackChain);
  const builderTsLoader = createBuilderTsLoader(tsLoader, enableTsLoader);
  const builderTsChecker = createBuilderTsChecker(normalizedConfig.output);

  return {
    tsChecker: builderTsChecker,
    styleLoader: disableCssExtract ? {} : undefined,
    cssExtract: disableCssExtract ? false : undefined,
    autoprefixer,
    babel: builderBabel,
    minifyCss,
    terser,
    cssLoader,
    webpack: builderWebpack,
    webpackChain: builderWebpackChain,
    tsLoader: builderTsLoader,
    styledComponents:
      styledComponents as Required<BuilderConfig>['tools']['styledComponents'],
    // TODO: infect by disableCssModuleExtension
    sass: sass as Required<BuilderConfig>['tools']['sass'],
    postcss: postcss as Required<BuilderConfig>['tools']['postcss'],
    // TODO: infect by disableCssModuleExtension
    less: less as Required<BuilderConfig>['tools']['less'],
    // can't remove comment in html minify.
    // some html template insert by using those comments.
    htmlPlugin: config => ({
      ...config,
      minify:
        typeof config.minify === 'object'
          ? {
              ...config.minify,
              removeComments: false,
            }
          : config.minify,
    }),
  };
}

type BuilderToolConfig = Required<BuilderConfig>['tools'];

function createBuilderWebpack(
  webpack: NormalizedConfig['tools']['webpack'],
): BuilderToolConfig['webpack'] {
  return webpack
    ? (config, utils) => {
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

function createBuilderWebpackChain(
  webpackChain: NormalizedConfig['tools']['webpackChain'],
): BuilderToolConfig['webpackChain'] {
  return webpackChain
    ? (chain: WebpackChain, utils) =>
        applyOptionsChain<any, any>(chain, webpackChain, utils)
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
  return (_: unknown, utils: TsLoaderUtils) =>
    applyOptionsChain<any, TsLoaderUtils>(defaultTsLoader, tsLoader, utils);
}

function createBuilderBabel(
  babel: NormalizedConfig['tools']['babel'],
  lodash: NormalizedConfig['tools']['lodash'],
): BuilderToolConfig['babel'] {
  return babel || lodash
    ? (config, utils) => {
        const lodashConfig = applyOptionsChain(
          { id: ['async', 'lodash-bound'] },
          lodash as any,
        );
        utils.addPlugins([['lodash', lodashConfig]]);
        return applyOptionsChain(config, babel || {}, utils);
      }
    : undefined;
}

function createBuilderTsChecker(output: NormalizedConfig['output']) {
  if (output.enableTsLoader || output.disableTsChecker) {
    return false;
  }
  const defaultTsLoader = {
    issue: {
      include: [{ file: '**/src/**/*' }],
      exclude: [
        { file: '**/*.(spec|test).ts' },
        { file: '**/node_modules/**/*' },
      ],
    },
  };
  return defaultTsLoader;
}
