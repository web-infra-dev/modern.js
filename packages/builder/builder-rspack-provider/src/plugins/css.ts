import assert from 'assert';
import {
  getBrowserslistWithDefault,
  isUseCssSourceMap,
  CSS_REGEX,
  type BuilderContext,
  BundlerChain,
  ModifyBundlerChainUtils,
  getCssSupport,
  setConfig,
  CSS_MODULES_REGEX,
  GLOBAL_CSS_REGEX,
  NODE_MODULES_REGEX,
  logger,
} from '@modern-js/builder-shared';
import type {
  BuilderPlugin,
  NormalizedConfig,
  RspackRule,
  RuleSetRule,
} from '../types';
import type { AcceptedPlugin } from 'postcss';
import { isUseCssExtract, getCompiledPath } from '../shared';

type CssNanoOptions = {
  configFile?: string | undefined;
  preset?: [string, object] | string | undefined;
};

export const getCssnanoDefaultOptions = (): CssNanoOptions => ({
  preset: [
    'default',
    {
      // merge longhand will break safe-area-inset-top, so disable it
      // https://github.com/cssnano/cssnano/issues/803
      // https://github.com/cssnano/cssnano/issues/967
      mergeLonghand: false,
    },
  ],
});

export async function applyBaseCSSRule(
  rule: ReturnType<BundlerChain['module']['rule']>,
  config: NormalizedConfig,
  context: BuilderContext,
  { target, isProd, isServer, isWebWorker, CHAIN_ID }: ModifyBundlerChainUtils,
) {
  // 1. Check user config
  const enableExtractCSS = isUseCssExtract(config, target);
  const enableSourceMap = isUseCssSourceMap(config);
  // const enableCSSModuleTS = Boolean(config.output.enableCssModuleTSDeclaration);

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

    const cssSupport = getCssSupport(browserslist);

    const mergedConfig = applyOptionsChain(
      {
        postcssOptions: {
          plugins: [
            require(getCompiledPath('postcss-flexbugs-fixes')),
            !cssSupport.customProperties &&
              require(getCompiledPath('postcss-custom-properties')),
            !cssSupport.initial && require(getCompiledPath('postcss-initial')),
            !cssSupport.pageBreak &&
              require(getCompiledPath('postcss-page-break')),
            !cssSupport.fontVariant &&
              require(getCompiledPath('postcss-font-variant')),
            !cssSupport.mediaMinmax &&
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
      config.tools.postcss || {},
      utils,
    );
    if (extraPlugins.length) {
      assert('postcssOptions' in mergedConfig);
      assert('plugins' in mergedConfig.postcssOptions!);
      mergedConfig.postcssOptions.plugins!.push(...extraPlugins);
    }
    return mergedConfig;
  };

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
    const postcssLoaderOptions = getPostcssConfig();

    rule
      .use(CHAIN_ID.USE.POSTCSS)
      .loader(require.resolve('@rspack/postcss-loader'))
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
) => {
  if (!rules) {
    return;
  }

  const ruleIndex = rules.findIndex(r => r !== '...' && r.test === ruleTest);

  if (ruleIndex === -1) {
    return;
  }

  const rule = rules[ruleIndex] as RuleSetRule;

  const { test, type, ...rest } = rule;

  if (disableCssModuleExtension) {
    // Equivalent to css-loader looseCssModules
    rules[ruleIndex] = {
      test: ruleTest,
      oneOf: [
        {
          ...rest,
          test: CSS_MODULES_REGEX,
          type: 'css/module',
        },
        {
          ...rest,
          test: NODE_MODULES_REGEX,
          type: 'css',
        },
        {
          ...rest,
          test: GLOBAL_CSS_REGEX,
          type: 'css',
        },
        {
          ...rest,
          type: 'css/module',
        },
      ],
    };
  } else {
    // Equivalent to css-loader modules.auto: true
    rules[ruleIndex] = {
      test: ruleTest,
      oneOf: [
        {
          ...rest,
          test: CSS_MODULES_REGEX,
          type: 'css/module',
        },
        {
          ...rest,
          type: 'css',
        },
      ],
    };
  }
};

export const builderPluginCss = (): BuilderPlugin => {
  return {
    name: 'builder-plugin-css',
    setup(api) {
      api.modifyBundlerChain(async (chain, utils) => {
        const config = api.getNormalizedConfig();

        const rule = chain.module.rule(utils.CHAIN_ID.RULE.CSS);
        rule.test(CSS_REGEX).type('css');

        await applyBaseCSSRule(rule, config, api.context, utils);
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
              `Not support custom hashDigest in output.cssModuleLocalIdentName when using Rspack. the 'base64' will be ignored.`,
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
          );
        },
      );
    },
  };
};
