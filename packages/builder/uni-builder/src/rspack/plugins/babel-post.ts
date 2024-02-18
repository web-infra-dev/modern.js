import lodash from 'lodash';
import { type RsbuildPlugin } from '@rsbuild/shared';
import { getDefaultBabelOptions } from '@rsbuild/plugin-babel';

/**
 * should not set babel-loader when babel config not modified
 */
export const pluginBabelPost = (): RsbuildPlugin => ({
  name: 'uni-builder:babel-post',

  pre: ['rsbuild:babel'],

  setup(api) {
    api.modifyBundlerChain(async (chain, { CHAIN_ID }) => {
      if (chain.module.rules.get(CHAIN_ID.RULE.JS)) {
        const babelLoaderOptions = chain.module
          .rule(CHAIN_ID.RULE.JS)
          .use(CHAIN_ID.USE.BABEL)
          .get('options');
        const config = api.getNormalizedConfig();

        if (
          babelLoaderOptions &&
          lodash.isEqual(
            getDefaultBabelOptions(config.source.decorators),
            babelLoaderOptions,
          )
        ) {
          chain.module.rule(CHAIN_ID.RULE.JS).uses.delete(CHAIN_ID.USE.BABEL);
        }
      }
    });
  },
});
