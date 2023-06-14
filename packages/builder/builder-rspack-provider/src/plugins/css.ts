import {
  getBrowserslistWithDefault,
  isUseCssSourceMap,
  CSS_REGEX,
  CSS_MODULES_REGEX,
  type BuilderContext,
  type StyleLoaderOptions,
  getCssLoaderOptions,
  BundlerChain,
  ModifyBundlerChainUtils,
  setConfig,
  logger,
  getCssModulesAutoRule,
  getPostcssConfig,
} from '@modern-js/builder-shared';
import path from 'path';
import type {
  BuilderPlugin,
  NormalizedConfig,
  RspackRule,
  RuleSetRule,
} from '../types';
import { isUseCssExtract, getCompiledPath } from '../shared';

export const enableNativeCss = (config: {
  output: {
    disableCssExtract: boolean;
  };
}) => !config.output.disableCssExtract;

export async function applyBaseCSSRule({
  rule,
  config,
  context,
  utils: { target, isProd, isServer, isWebWorker, CHAIN_ID },
  importLoaders = 1,
}: {
  rule: ReturnType<BundlerChain['module']['rule']>;
  config: NormalizedConfig;
  context: BuilderContext;
  utils: ModifyBundlerChainUtils;
  importLoaders?: number;
}) {
  // 1. Check user config
  const enableExtractCSS = isUseCssExtract(config, target);
  const enableSourceMap = isUseCssSourceMap(config);
  const enableCSSModuleTS = Boolean(config.output.enableCssModuleTSDeclaration);
  const { applyOptionsChain } = await import('@modern-js/utils');

  const browserslist = await getBrowserslistWithDefault(
    context.rootPath,
    config,
    target,
  );

  const enableCssMinify = !enableExtractCSS && isProd;

  // when disableExtractCSS, use css-loader + style-loader
  if (!enableNativeCss(config)) {
    const localIdentName =
      config.output.cssModuleLocalIdentName ||
      // Using shorter classname in production to reduce bundle size
      (isProd ? '[hash:base64:5]' : '[path][name]__[local]--[hash:base64:5]');

    const cssLoaderOptions = await getCssLoaderOptions({
      config,
      enableSourceMap,
      importLoaders,
      isServer,
      isWebWorker,
      localIdentName,
    });

    if (!isServer && !isWebWorker) {
      const styleLoaderOptions = applyOptionsChain<StyleLoaderOptions, null>(
        {
          // todo: hmr does not work while esModule is true
          // @ts-expect-error
          esModule: false,
        },
        config.tools.styleLoader,
      );
      rule
        .use(CHAIN_ID.USE.STYLE)
        .loader(require.resolve('style-loader'))
        .options(styleLoaderOptions)
        .end();

      // todo: use plugin instead (can be worked in rspack native css)
      // https://github.com/webpack/webpack/issues/14893#issuecomment-1589561543
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
  } else {
    rule.type('css');
  }

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

/**
 * Use type: "css/module" rule instead of css-loader modules.auto config
 *
 * applyCSSModuleRule in modifyRspackConfig, so that other plugins can easily adjust css rule in Chain.
 */
export const applyCSSModuleRule = (
  rules: RspackRule[] | undefined,
  ruleTest: RegExp,
  config: NormalizedConfig,
) => {
  if (!rules || !enableNativeCss(config)) {
    return;
  }

  const ruleIndex = rules.findIndex(r => r !== '...' && r.test === ruleTest);

  if (ruleIndex === -1) {
    return;
  }

  const cssModulesAuto = getCssModulesAutoRule(
    config.output.cssModules,
    config.output.disableCssModuleExtension,
  );

  if (!cssModulesAuto) {
    return;
  }

  const rule = rules[ruleIndex] as RuleSetRule;

  const { test, type, ...rest } = rule;

  rules[ruleIndex] = {
    test: ruleTest,
    oneOf: [
      {
        ...rest,
        test:
          typeof cssModulesAuto !== 'boolean'
            ? cssModulesAuto
            : // auto: true
              CSS_MODULES_REGEX,
        type: 'css/module',
      },
      {
        ...rest,
        type: 'css',
      },
    ],
  };
};

export const builderPluginCss = (): BuilderPlugin => {
  return {
    name: 'builder-plugin-css',
    setup(api) {
      api.modifyBundlerChain(async (chain, utils) => {
        const config = api.getNormalizedConfig();

        const rule = chain.module.rule(utils.CHAIN_ID.RULE.CSS);
        rule.test(CSS_REGEX);

        await applyBaseCSSRule({
          rule,
          utils,
          config,
          context: api.context,
        });
      });
      api.modifyRspackConfig(
        async (rspackConfig, { isProd, isServer, isWebWorker }) => {
          const config = api.getNormalizedConfig();

          if (!enableNativeCss(config)) {
            setConfig(rspackConfig, 'experiments.css', false);
            return;
          }

          let localIdentName =
            config.output.cssModuleLocalIdentName ||
            // Using shorter classname in production to reduce bundle size
            (isProd ? '[hash:5]' : '[path][name]__[local]--[hash:5]');

          if (localIdentName.includes(':base64')) {
            logger.warn(
              `Custom hashDigest in output.cssModuleLocalIdentName is currently not supported when using Rspack, the 'base64' will be ignored.`,
            );
            localIdentName = localIdentName.replace(':base64', '');
          }

          // need use type: "css/module" rule instead of modules.auto config
          setConfig(rspackConfig, 'builtins.css.modules', {
            localsConvention: 'camelCase',
            localIdentName,
            exportsOnly: isServer || isWebWorker,
          });

          const rules = rspackConfig.module?.rules;

          applyCSSModuleRule(rules, CSS_REGEX, config);
        },
      );
    },
  };
};
