import {
  CSS_REGEX,
  getPostcssConfig,
  ModifyChainUtils,
  isUseCssSourceMap,
  getCssLoaderOptions,
  getBrowserslistWithDefault,
  getCssModuleLocalIdentName,
  BundlerChainRule,
  type BuilderTarget,
  type BuilderContext,
  type StyleLoaderOptions,
} from '@modern-js/builder-shared';
import type {
  BuilderPlugin,
  CSSExtractOptions,
  NormalizedConfig,
} from '../types';

export const isUseCssExtract = (
  config: NormalizedConfig,
  target: BuilderTarget,
) =>
  !config.output.disableCssExtract &&
  target !== 'node' &&
  target !== 'web-worker';

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

  const localIdentName = getCssModuleLocalIdentName(config, isProd);

  const cssLoaderOptions = await getCssLoaderOptions({
    config,
    enableSourceMap,
    importLoaders,
    isServer,
    isWebWorker,
    localIdentName,
  });

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
        .loader('@modern-js/builder-shared/css-modules-typescript-loader')
        .options({
          modules: cssLoaderOptions.modules,
        })
        .end();
    }
  } else {
    rule
      .use(CHAIN_ID.USE.IGNORE_CSS)
      .loader('@modern-js/builder-shared/ignore-css-loader')
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
