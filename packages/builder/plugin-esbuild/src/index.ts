import type { BuilderPlugin } from '@modern-js/webpack-builder';
import type {
  LoaderOptions,
  MinifyPluginOptions,
} from '../compiled/esbuild-loader/interfaces';

export interface EsbuildOptions {
  loader?: false | LoaderOptions;
  minimize?: false | MinifyPluginOptions;
}

export const JS_REGEX = /\.(js|mjs|cjs|jsx)$/;
export const TS_REGEX = /\.(ts|mts|cts|tsx)$/;

export function PluginEsbuild(
  options: EsbuildOptions = {
    loader: {},
    minimize: {},
  },
): BuilderPlugin {
  return {
    name: 'webpack-builder-plugin-esbuild',

    setup(api) {
      api.modifyWebpackChain(async (chain, { CHAIN_ID, isProd }) => {
        const builderConfig = api.getBuilderConfig();
        const compiledEsbuildLoaderPath = require.resolve(
          '../compiled/esbuild-loader',
        );

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
              target: 'es2015',
              ...options?.loader,
            });
          chain.module
            .rule(CHAIN_ID.RULE.TS)
            .test(TS_REGEX)
            .use(CHAIN_ID.USE.ESBUILD)
            .loader(compiledEsbuildLoaderPath)
            .options({
              loader: 'tsx',
              target: 'es2015',
              ...options?.loader,
            });
        }

        if (isProd && options.minimize !== false) {
          const { ESBuildMinifyPlugin } = await import(
            '../compiled/esbuild-loader'
          );
          chain.optimization
            .delete(CHAIN_ID.MINIMIZER.JS)
            .delete(CHAIN_ID.MINIMIZER.CSS);
          chain.optimization
            .minimizer(CHAIN_ID.MINIMIZER.ESBUILD)
            .use(ESBuildMinifyPlugin)
            .init(
              () =>
                new ESBuildMinifyPlugin({
                  legalComments: builderConfig.output?.legalComments,
                  ...options?.minimize,
                }),
            );
        }
      });
    },
  };
}
