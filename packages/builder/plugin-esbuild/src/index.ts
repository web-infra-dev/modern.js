import { JS_REGEX, TS_REGEX } from '@modern-js/builder-shared';
import type { BuilderPlugin } from '@modern-js/builder';
import type { BuilderPluginAPI } from '@modern-js/builder-webpack-provider';
import type {
  LoaderOptions,
  MinifyPluginOptions,
} from '../compiled/esbuild-loader/interfaces';

export interface EsbuildOptions {
  loader?: false | LoaderOptions;
  minimize?: false | MinifyPluginOptions;
}

export function PluginEsbuild(
  userOptions: EsbuildOptions = {},
): BuilderPlugin<BuilderPluginAPI> {
  return {
    name: 'builder-plugin-esbuild',

    setup(api) {
      api.modifyWebpackChain(async (chain, { CHAIN_ID, isProd }) => {
        const builderConfig = api.getNormalizedConfig();
        const compiledEsbuildLoaderPath = require.resolve(
          '../compiled/esbuild-loader',
        );

        const options = {
          loader: {
            target: 'es2015',
            charset: builderConfig.output.charset,
          },
          minimize: {
            css: true,
            target: 'es2015',
          },
          ...userOptions,
        };

        if (options.loader !== false) {
          // remove babel-loader and ts-loader
          chain.module.rule(CHAIN_ID.RULE.JS).uses.delete(CHAIN_ID.USE.BABEL);
          chain.module
            .rule(CHAIN_ID.RULE.TS)
            .uses.delete(CHAIN_ID.USE.BABEL)
            .delete(CHAIN_ID.USE.TS);

          // add esbuild-loader
          chain.module
            .rule(CHAIN_ID.RULE.JS)
            .test(JS_REGEX)
            .use(CHAIN_ID.USE.ESBUILD)
            .loader(compiledEsbuildLoaderPath)
            .options({
              loader: 'jsx',
              ...options?.loader,
            });
          chain.module
            .rule(CHAIN_ID.RULE.TS)
            .test(TS_REGEX)
            .use(CHAIN_ID.USE.ESBUILD)
            .loader(compiledEsbuildLoaderPath)
            .options({
              loader: 'tsx',
              ...options?.loader,
            });
        }

        if (isProd && options.minimize !== false) {
          const { ESBuildMinifyPlugin } = await import(
            '../compiled/esbuild-loader'
          );

          // @ts-expect-error webpack-chain missing minimizers type
          chain.optimization.minimizers
            .delete(CHAIN_ID.MINIMIZER.JS)
            .delete(CHAIN_ID.MINIMIZER.CSS);

          chain.optimization
            .minimizer(CHAIN_ID.MINIMIZER.ESBUILD)
            .use(ESBuildMinifyPlugin)
            .init(
              () =>
                new ESBuildMinifyPlugin({
                  // other legalComments such as linked is not supported yet
                  // https://github.com/privatenumber/esbuild-loader/issues/263
                  legalComments:
                    builderConfig.output?.legalComments === 'none'
                      ? 'none'
                      : 'inline',
                  ...options?.minimize,
                }),
            );
        }
      });
    },
  };
}
