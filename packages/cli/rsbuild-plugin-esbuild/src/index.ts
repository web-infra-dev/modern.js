import path from 'path';
import type {
  RsbuildPlugin,
  RspackChain,
  RsbuildContext,
  NormalizedConfig,
} from '@rsbuild/core';
import type {
  LoaderOptions,
  MinifyPluginOptions,
} from '../compiled/esbuild-loader';

const JS_REGEX = /\.(?:js|mjs|cjs|jsx)$/;
const TS_REGEX = /\.(?:ts|mts|cts|tsx)$/;
const NODE_MODULES_REGEX = /[\\/]node_modules[\\/]/;
const castArray = <T>(arr?: T | T[]): T[] => {
  if (arr === undefined) {
    return [];
  }
  return Array.isArray(arr) ? arr : [arr];
};

function applyScriptCondition({
  rule,
  chain,
  config,
  context,
  includes,
  excludes,
}: {
  rule: RspackChain.Rule;
  chain: RspackChain;
  config: NormalizedConfig;
  context: RsbuildContext;
  includes: (string | RegExp)[];
  excludes: (string | RegExp)[];
}): void {
  // compile all folders in app directory, exclude node_modules
  // which can be removed next version of rspack
  rule.include.add({
    and: [context.rootPath, { not: NODE_MODULES_REGEX }],
  });

  // Always compile TS and JSX files.
  // Otherwise, it will lead to compilation errors and incorrect output.
  rule.include.add(/\.(?:ts|tsx|jsx|mts|cts)$/);

  // The Rsbuild runtime code is es2017 by default,
  // transform the runtime code if user target < es2017
  const target = castArray(chain.get('target'));
  const legacyTarget = ['es5', 'es6', 'es2015', 'es2016'];
  if (legacyTarget.some(item => target.includes(item))) {
    rule.include.add(/[\\/]@rsbuild[\\/]core[\\/]dist[\\/]/);
  }

  for (const condition of [...includes, ...(config.source.include || [])]) {
    rule.include.add(condition);
  }

  for (const condition of [...excludes, ...(config.source.exclude || [])]) {
    rule.exclude.add(condition);
  }
}

export interface PluginEsbuildOptions {
  loader?: false | LoaderOptions;
  minimize?: false | MinifyPluginOptions;
}

export function pluginEsbuild(
  userOptions: PluginEsbuildOptions = {},
): RsbuildPlugin {
  return {
    name: 'modernjs:esbuild',

    setup(api) {
      api.modifyBundlerChain(async (chain, { CHAIN_ID, isProd, target }) => {
        const rsbuildConfig = api.getNormalizedConfig();
        const esbuildLoaderPath = path.join(
          __dirname,
          '../compiled/esbuild-loader/index.js',
        );

        const options: PluginEsbuildOptions = {
          loader: {
            target: 'es2015',
            charset: rsbuildConfig.output.charset,
          },
          minimize: {
            css: true,
            target: 'es2015',
            format: target === 'web' ? 'iife' : undefined,
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
            .use('esbuild')
            .loader(esbuildLoaderPath)
            .options({
              loader: 'jsx',
              ...options?.loader,
            });

          const rule = chain.module.rule(CHAIN_ID.RULE.TS);
          rule
            .test(TS_REGEX)
            .use('esbuild')
            .loader(esbuildLoaderPath)
            .options({
              loader: 'tsx',
              ...options?.loader,
            });
          applyScriptCondition({
            chain,
            rule,
            config: rsbuildConfig,
            context: api.context,
            includes: [],
            excludes: [],
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
            .minimizer('js-css')
            .use(ESBuildMinifyPlugin)
            .init(
              () =>
                new ESBuildMinifyPlugin({
                  // other legalComments such as linked is not supported yet
                  // https://github.com/privatenumber/esbuild-loader/issues/263
                  legalComments:
                    rsbuildConfig.output?.legalComments === 'none'
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
