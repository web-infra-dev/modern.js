import path from 'path';
import {
  CSS_REGEX,
  getPostcssConfig,
  ModifyChainUtils,
  isUseCssSourceMap,
  getCssModulesAutoRule,
  getBrowserslistWithDefault,
  BundlerChainRule,
  type BuilderTarget,
  type BuilderContext,
} from '@modern-js/builder-shared';
import { merge as deepMerge } from '@modern-js/utils/lodash';
import type {
  BuilderPlugin,
  CSSExtractOptions,
  CSSLoaderOptions,
  NormalizedConfig,
  StyleLoaderOptions,
} from '../types';

export const isUseCssExtract = (
  config: NormalizedConfig,
  target: BuilderTarget,
) =>
  !config.output.disableCssExtract &&
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

export async function applyBaseCSSRule({
  rule,
  config,
  context,
  utils: { target, isProd, isServer, CHAIN_ID, isWebWorker, getCompiledPath },
  importLoaders = 1,
}: {
  rule: BundlerChainRule;
  config: NormalizedConfig;
  context: BuilderContext;
  utils: ModifyChainUtils;
  importLoaders?: number;
}) {
  const { applyOptionsChain } = await import('@modern-js/utils');
  const browserslist = await getBrowserslistWithDefault(
    context.rootPath,
    config,
    target,
  );

  // 1. Check user config
  const enableExtractCSS = isUseCssExtract(config, target);
  const enableCssMinify = !enableExtractCSS && isProd;

  const enableSourceMap = isUseCssSourceMap(config);
  const enableCSSModuleTS = Boolean(config.output.enableCssModuleTSDeclaration);
  // 2. Prepare loader options
  const extraCSSOptions: Required<CSSExtractOptions> =
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

  const localIdentName =
    config.output.cssModuleLocalIdentName ||
    // Using shorter classname in production to reduce bundle size
    (isProd ? '[hash:base64:5]' : '[path][name]__[local]--[hash:base64:5]');

  const { cssModules } = config.output;

  const mergedCssLoaderOptions = applyOptionsChain<CSSLoaderOptions, null>(
    {
      importLoaders,
      modules: {
        auto: getCssModulesAutoRule(
          cssModules,
          config.output.disableCssModuleExtension,
        ),
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
    if (enableCSSModuleTS && cssLoaderOptions.modules) {
      rule
        .use(CHAIN_ID.USE.CSS_MODULES_TS)
        .loader(
          require.resolve('../webpackLoaders/css-modules-typescript-loader'),
        )
        .options({
          modules: cssLoaderOptions.modules,
        })
        .end();
    }
  } else {
    rule
      .use(CHAIN_ID.USE.IGNORE_CSS)
      .loader(path.resolve(__dirname, '../webpackLoaders/ignoreCssLoader'))
      .end();
  }

  rule
    .use(CHAIN_ID.USE.CSS)
    .loader(getCompiledPath('css-loader'))
    .options(cssLoaderOptions)
    .end();

  if (!isServer && !isWebWorker) {
    const postcssLoaderOptions = await getPostcssConfig({
      enableSourceMap,
      browserslist,
      config,
      enableCssMinify,
    });

    rule
      .use(CHAIN_ID.USE.POSTCSS)
      .loader(getCompiledPath('postcss-loader'))
      .options(postcssLoaderOptions)
      .end();
  }

  // CSS imports should always be treated as sideEffects
  rule.merge({ sideEffects: true });
}

export const builderPluginCss = (): BuilderPlugin => {
  return {
    name: 'builder-plugin-css',
    setup(api) {
      api.modifyBundlerChain(async (chain, utils) => {
        const rule = chain.module.rule(utils.CHAIN_ID.RULE.CSS);
        const config = api.getNormalizedConfig();
        rule.test(CSS_REGEX);
        await applyBaseCSSRule({
          rule,
          utils,
          config,
          context: api.context,
        });
      });
    },
  };
};
