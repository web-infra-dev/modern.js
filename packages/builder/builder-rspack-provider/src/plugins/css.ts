import {
  getBrowserslistWithDefault,
  isUseCssSourceMap,
  CSS_REGEX,
  CSS_MODULES_REGEX,
  type BuilderContext,
  BundlerChain,
  ModifyBundlerChainUtils,
  setConfig,
  logger,
  CssModules,
  getCssModulesAutoRule,
  getPostcssConfig,
} from '@modern-js/builder-shared';
import type {
  BuilderPlugin,
  NormalizedConfig,
  RspackRule,
  RuleSetRule,
} from '../types';
import { isUseCssExtract, getCompiledPath } from '../shared';

export async function applyBaseCSSRule({
  rule,
  config,
  context,
  utils: { target, isProd, isServer, isWebWorker, CHAIN_ID },
}: {
  rule: ReturnType<BundlerChain['module']['rule']>;
  config: NormalizedConfig;
  context: BuilderContext;
  utils: ModifyBundlerChainUtils;
}) {
  // 1. Check user config
  const enableExtractCSS = isUseCssExtract(config, target);
  const enableSourceMap = isUseCssSourceMap(config);
  // const enableCSSModuleTS = Boolean(config.output.enableCssModuleTSDeclaration);

  const browserslist = await getBrowserslistWithDefault(
    context.rootPath,
    config,
    target,
  );

  const enableCssMinify = !enableExtractCSS && isProd;

  /**
   * TODO: support style-loader & ignore css (need Rspack support inline css first)
   */
  //   if (isServer || isWebWorker) {
  //     const { default: ignoreCssLoader } = await import('../loaders/ignoreCssLoader');
  //     uses.push({
  //       name: CHAIN_ID.USE.IGNORE_CSS,
  //       loader: ignoreCssLoader,
  //     });
  //   }

  // TODO: use css-modules-typescript-loader
  // if (enableCSSModuleTS) {
  //   const { default: cssModulesTypescriptLoader } = await import(
  //     getCompiledPath('css-modules-typescript-loader')
  //   );

  //   uses.push({
  //     name: CHAIN_ID.USE.CSS_MODULES_TS,
  //     loader: cssModulesTypescriptLoader,
  //     options: {},
  //   });
  // }

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
  disableCssModuleExtension: boolean | undefined,
  modules?: CssModules,
) => {
  if (!rules) {
    return;
  }

  const ruleIndex = rules.findIndex(r => r !== '...' && r.test === ruleTest);

  if (ruleIndex === -1) {
    return;
  }

  const cssModulesAuto = getCssModulesAutoRule(
    modules,
    disableCssModuleExtension,
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
        rule.test(CSS_REGEX).type('css');

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

          applyCSSModuleRule(
            rules,
            CSS_REGEX,
            config.output.disableCssModuleExtension,
            config.output.cssModules,
          );
        },
      );
    },
  };
};
