import assert from 'assert';
import {
  isLooseCssModules,
  getBrowserslistWithDefault,
  isUseCssSourceMap,
  CSS_REGEX,
  type BuilderContext,
  BundlerChain,
  ModifyBundlerChainUtils,
  getCssSupport,
} from '@modern-js/builder-shared';
import type { BuilderPlugin, NormalizedConfig } from '../types';
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

  const localIdentName =
    config.output.cssModuleLocalIdentName ||
    // Using shorter classname in production to reduce bundle size
    (isProd ? '[hash:base64:5]' : '[path][name]__[local]--[hash:base64:5]');

  /**
   * postcss-module options.
   * different with css-loader, postcss-module without exportOnlyLocals option
   *
   * TODO: support css-module in rspack
   */
  const moduleConfig = {
    auto: config.output.disableCssModuleExtension ? isLooseCssModules : true,
    localsConvention: 'camelCase',
    generateScopedName: localIdentName,
  };

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
        modules: moduleConfig,
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
   * TODO: support style-loader & ignore css (need rspack support inline css first)
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
    // todo: css module (exportOnlyLocals) required in server
    const postcssLoaderOptions = getPostcssConfig();

    rule
      .use(CHAIN_ID.USE.POSTCSS)
      .loader(require.resolve('@rspack/postcss-loader'))
      .options(postcssLoaderOptions)
      .end();
  }

  // todo: rspack not support sideEffects config
  // CSS imports should always be treated as sideEffects
  // rule.merge({ sideEffects: true });
}

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
    },
  };
};
