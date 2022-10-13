import { CSS_REGEX, type BuilderContext } from '@modern-js/builder-shared';
import { getBrowserslistWithDefault } from '../shared';
import {
  BuilderConfig,
  BuilderPlugin,
  CSSLoaderOptions,
  MiniCssExtractLoaderOptions,
  ModifyWebpackUtils,
  StyleLoaderOptions,
  WebpackChain,
} from '../types';

import type { AcceptedPlugin, ProcessOptions } from 'postcss';

export async function applyBaseCSSRule(
  rule: WebpackChain.Rule,
  config: BuilderConfig,
  context: BuilderContext,
  utils: ModifyWebpackUtils,
) {
  const { isServer, isProd, CHAIN_ID, getCompiledPath } = utils;
  const { applyOptionsChain } = await import('@modern-js/utils');
  const browserslist = await getBrowserslistWithDefault(
    context.rootPath,
    config,
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
                config.tools?.autoprefixer,
              ),
            ),
            enableCssMinify ? require('cssnano')({ preset: 'default' }) : false,
          ].filter(Boolean),
        },
        sourceMap: enableSourceMap,
      },
      config.tools?.postcss || {},
      utils,
    );
    if (extraPlugins.length) {
      mergedConfig.postcssOptions!.plugins!.push(...extraPlugins);
    }

    return mergedConfig as ProcessOptions & {
      postcssOptions: {
        plugins?: AcceptedPlugin[];
      };
    };
  };

  // 1. Check user config
  const enableExtractCSS = !config.tools?.styleLoader;
  const enableCSSModuleTS = Boolean(
    config.output?.enableCssModuleTSDeclaration,
  );
  const enableSourceMap =
    isProd && enableExtractCSS && !config.output?.disableSourceMap;
  // 2. Prepare loader options
  const extractLoaderOptions = applyOptionsChain<
    MiniCssExtractLoaderOptions,
    null
  >({}, config.tools?.cssExtract?.loaderOptions || {});
  const styleLoaderOptions = applyOptionsChain<StyleLoaderOptions, null>(
    {},
    config.tools?.styleLoader || {},
  );
  const cssLoaderOptions = applyOptionsChain<CSSLoaderOptions, null>(
    {
      importLoaders: 1,
      modules: {
        auto: true,
        exportLocalsConvention: 'camelCase',
        localIdentName: isProd
          ? '[hash:base64]'
          : '[path][name]__[local]--[hash:base64:5]',
        exportOnlyLocals: isServer,
      },
      sourceMap: enableSourceMap,
    },
    config.tools?.cssLoader,
  );
  const postcssLoaderOptions = getPostcssConfig();

  // 3. Create webpack rule
  // Order: style-loader/mini-css-extract -> css-loader -> postcss-loader
  rule
    .when(
      enableExtractCSS,
      // use mini-css-extract-plugin loader
      c => {
        c.use(CHAIN_ID.USE.MINI_CSS_EXTRACT)
          .loader(require('mini-css-extract-plugin').loader)
          .options(extractLoaderOptions)
          .end();
      },
      // or use style-loader
      c => {
        c.use(CHAIN_ID.USE.STYLE)
          .loader(require.resolve('style-loader'))
          .options(styleLoaderOptions)
          .end();
      },
    )
    // use css-modules-typescript-loader
    .when(enableCSSModuleTS, c => {
      c.use(CHAIN_ID.USE.CSS_MODULES_TS)
        .loader(getCompiledPath('css-modules-typescript-loader'))
        .end();
    })
    .use(CHAIN_ID.USE.CSS)
    .loader(getCompiledPath('css-loader'))
    .options(cssLoaderOptions)
    .end()
    .use(CHAIN_ID.USE.POSTCSS)
    .loader(getCompiledPath('postcss-loader'))
    .options(postcssLoaderOptions)
    .end();

  // CSS imports should always be treated as sideEffects
  rule.merge({ sideEffects: true });
}

export const PluginCss = (): BuilderPlugin => {
  return {
    name: 'builder-plugin-css',
    setup(api) {
      api.modifyWebpackChain(async (chain, utils) => {
        const rule = chain.module.rule(utils.CHAIN_ID.RULE.CSS);
        const config = api.getBuilderConfig();
        rule.test(CSS_REGEX);
        await applyBaseCSSRule(rule, config, api.context, utils);
      });
    },
  };
};
