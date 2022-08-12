import { CSS_REGEX, GLOBAL_CSS_REGEX, isNodeModulesCss } from '../shared';
import {
  BuilderPlugin,
  CSSLoaderOptions,
  MiniCssExtractLoaderOptions,
  StyleLoaderOptions,
} from '../types';

import type { AcceptedPlugin, ProcessOptions } from 'postcss';

export const PluginCss = (): BuilderPlugin => {
  return {
    name: 'web-builder-plugin-css',
    setup(api) {
      api.modifyWebpackChain(async (chain, { isServer, isProd, CHAIN_ID }) => {
        const { applyOptionsChain, getBrowserslist } = await import(
          '@modern-js/utils'
        );

        const config = api.getBuilderConfig();

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
                  require('postcss-flexbugs-fixes'),
                  require('postcss-custom-properties'),
                  require('postcss-initial'),
                  require('postcss-page-break'),
                  require('postcss-font-variant'),
                  require('postcss-media-minmax'),
                  require('postcss-nesting'),
                  require('autoprefixer')(
                    applyOptionsChain(
                      {
                        flexbox: 'no-2009',
                        overrideBrowserslist: getBrowserslist(
                          api.context.rootPath,
                        ),
                      },
                      config.tools?.autoprefixer,
                    ),
                  ),
                  enableCssMinify
                    ? require('cssnano')({ preset: 'default' })
                    : false,
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
        const enableExtractCSS = Boolean(config.tools?.cssExtract);
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
        const rule = chain.module
          .rule(CHAIN_ID.RULE.CSS)
          .test(CSS_REGEX)
          .exclude.add(isNodeModulesCss)
          .add(GLOBAL_CSS_REGEX)
          .end()
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
              .loader(require.resolve('css-modules-typescript-loader'))
              .end();
          })
          .use(CHAIN_ID.USE.CSS)
          .loader(require.resolve('css-loader'))
          .options(cssLoaderOptions)
          .end()
          .use(CHAIN_ID.USE.POSTCSS)
          .loader(require.resolve('postcss-loader'))
          .options(postcssLoaderOptions)
          .end();

        // CSS imports should always be treated as sideEffects
        rule.merge({ sideEffects: true });
      });
    },
  };
};
