import path from 'path';
import assert from 'assert';
import {
  CSS_REGEX,
  isLooseCssModules,
  getBrowserslistWithDefault,
  type BuilderTarget,
  type BuilderContext,
} from '@modern-js/builder-shared';
import _, { merge as deepMerge } from '@modern-js/utils/lodash';
import type {
  WebpackChain,
  BuilderPlugin,
  CssExtractOptions,
  CSSLoaderOptions,
  NormalizedConfig,
  StyleLoaderOptions,
  ModifyWebpackChainUtils,
} from '../types';
import type { AcceptedPlugin, ProcessOptions } from 'postcss';
import { getCssnanoDefaultOptions } from './minimize';

export const isUseCssExtract = (
  config: NormalizedConfig,
  target: BuilderTarget,
) =>
  config.tools.cssExtract !== false &&
  !config.tools.styleLoader &&
  target !== 'node' &&
  target !== 'web-worker';

// If the target is 'node' or 'web-worker' and the modules option of css-loader is enabled,
// we must enable exportOnlyLocals to only exports the modules identifier mappings.
// Otherwise, the compiled CSS code may contain invalid code, such as `new URL`.
// https://github.com/webpack-contrib/css-loader#exportonlylocals
export const normalizeCssLoaderOptions = (
  options: CSSLoaderOptions,
  exportOnlyLocals: boolean,
) => {
  if (options.modules && exportOnlyLocals) {
    let { modules } = options;
    if (modules === true) {
      modules = { exportOnlyLocals: true };
    } else if (typeof modules === 'string') {
      modules = { mode: modules, exportOnlyLocals: true };
    } else {
      // create a new object to avoid modifying the original options
      modules = {
        ...modules,
        exportOnlyLocals: true,
      };
    }

    return {
      ...options,
      modules,
    };
  }

  return options;
};

export async function applyBaseCSSRule(
  rule: WebpackChain.Rule,
  config: NormalizedConfig,
  context: BuilderContext,
  {
    target,
    isProd,
    isServer,
    CHAIN_ID,
    isWebWorker,
    getCompiledPath,
  }: ModifyWebpackChainUtils,
) {
  const { applyOptionsChain } = await import('@modern-js/utils');
  const browserslist = await getBrowserslistWithDefault(
    context.rootPath,
    config,
    target,
  );

  const getPostcssConfig = () => {
    const extraPlugins: AcceptedPlugin[] = [];

    const utils = {
      addPlugins(plugins: AcceptedPlugin | AcceptedPlugin[]) {
        if (Array.isArray(plugins)) {
          extraPlugins.push(...plugins);
        } else {
          extraPlugins.push(plugins);
        }
      },
    };

    const enableCssMinify = !enableExtractCSS && isProd;

    const mergedConfig = applyOptionsChain(
      {
        postcssOptions: {
          plugins: [
            require(getCompiledPath('postcss-flexbugs-fixes')),
            require(getCompiledPath('postcss-custom-properties')),
            require(getCompiledPath('postcss-initial')),
            require(getCompiledPath('postcss-page-break')),
            require(getCompiledPath('postcss-font-variant')),
            require(getCompiledPath('postcss-media-minmax')),
            require(getCompiledPath('postcss-nesting')),
            require(getCompiledPath('autoprefixer'))(
              applyOptionsChain(
                {
                  flexbox: 'no-2009',
                  overrideBrowserslist: browserslist,
                },
                config.tools.autoprefixer,
              ),
            ),
            enableCssMinify
              ? require('cssnano')(getCssnanoDefaultOptions())
              : false,
          ].filter(Boolean),
        },
        sourceMap: enableSourceMap,
      },
      // postcss-loader will modify config
      _.cloneDeep(config.tools.postcss || {}),
      utils,
    );
    if (extraPlugins.length) {
      assert('postcssOptions' in mergedConfig);
      assert('plugins' in mergedConfig.postcssOptions!);
      mergedConfig.postcssOptions.plugins!.push(...extraPlugins);
    }

    return mergedConfig as ProcessOptions & {
      postcssOptions: {
        plugins?: AcceptedPlugin[];
      };
    };
  };

  // 1. Check user config
  const enableExtractCSS = isUseCssExtract(config, target);
  const enableSourceMap = !config.output.disableSourceMap;
  const enableCSSModuleTS = Boolean(config.output.enableCssModuleTSDeclaration);
  // 2. Prepare loader options
  const extraCSSOptions: Required<CssExtractOptions> =
    typeof config.tools.cssExtract === 'object'
      ? config.tools.cssExtract
      : {
          loaderOptions: {},
          pluginOptions: {},
        };
  const styleLoaderOptions = applyOptionsChain<StyleLoaderOptions, null>(
    {},
    config.tools.styleLoader,
  );

  // 3. Create webpack rule
  // Order: style-loader/mini-css-extract -> css-loader -> postcss-loader
  if (!isServer && !isWebWorker) {
    // use mini-css-extract-plugin loader
    if (enableExtractCSS) {
      rule
        .use(CHAIN_ID.USE.MINI_CSS_EXTRACT)
        .loader(require('mini-css-extract-plugin').loader)
        .options(extraCSSOptions.loaderOptions)
        .end();
    }
    // use style-loader
    else {
      rule
        .use(CHAIN_ID.USE.STYLE)
        .loader(require.resolve('style-loader'))
        .options(styleLoaderOptions)
        .end();
    }

    // use css-modules-typescript-loader
    if (enableCSSModuleTS) {
      rule
        .use(CHAIN_ID.USE.CSS_MODULES_TS)
        .loader(getCompiledPath('css-modules-typescript-loader'))
        .end();
    }
  } else {
    rule
      .use(CHAIN_ID.USE.IGNORE_CSS)
      .loader(path.resolve(__dirname, '../webpackLoaders/ignoreCssLoader'))
      .end();
  }

  const localIdentName =
    config.output.cssModuleLocalIdentName ||
    // Using shorter classname in production to reduce bundle size
    (isProd ? '[hash:base64:5]' : '[path][name]__[local]--[hash:base64:5]');

  const mergedCssLoaderOptions = applyOptionsChain<CSSLoaderOptions, null>(
    {
      importLoaders: 1,
      modules: {
        auto: config.output.disableCssModuleExtension
          ? isLooseCssModules
          : true,
        exportLocalsConvention: 'camelCase',
        localIdentName,
      },
      sourceMap: enableSourceMap,
    },
    config.tools.cssLoader,
    undefined,
    deepMerge,
  );
  const cssLoaderOptions = normalizeCssLoaderOptions(
    mergedCssLoaderOptions,
    isServer || isWebWorker,
  );

  rule
    .use(CHAIN_ID.USE.CSS)
    .loader(getCompiledPath('css-loader'))
    .options(cssLoaderOptions)
    .end();

  if (!isServer && !isWebWorker) {
    const postcssLoaderOptions = getPostcssConfig();
    rule
      .use(CHAIN_ID.USE.POSTCSS)
      .loader(getCompiledPath('postcss-loader'))
      .options(postcssLoaderOptions)
      .end();
  }

  // CSS imports should always be treated as sideEffects
  rule.merge({ sideEffects: true });
}

export const PluginCss = (): BuilderPlugin => {
  return {
    name: 'builder-plugin-css',
    setup(api) {
      api.modifyWebpackChain(async (chain, utils) => {
        const rule = chain.module.rule(utils.CHAIN_ID.RULE.CSS);
        const config = api.getNormalizedConfig();
        rule.test(CSS_REGEX);
        await applyBaseCSSRule(rule, config, api.context, utils);
      });
    },
  };
};
