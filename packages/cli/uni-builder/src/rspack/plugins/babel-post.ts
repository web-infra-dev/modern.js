import lodash from 'lodash';
import { type RsbuildPlugin } from '@rsbuild/shared';
import { getDefaultBabelOptions } from '@rsbuild/plugin-babel';

/**
 * should not set babel-loader when babel config not modified
 */
export const pluginBabelPost = (): RsbuildPlugin => ({
  name: 'uni-builder:babel-post',

  setup(api) {
    api.modifyBundlerChain({
      handler: async (chain, { CHAIN_ID }) => {
        if (chain.module.rules.get(CHAIN_ID.RULE.JS)) {
          const { cacheIdentifier, ...babelLoaderOptions } = chain.module
            .rule(CHAIN_ID.RULE.JS)
            .use(CHAIN_ID.USE.BABEL)
            .get('options');

          const config = api.getNormalizedConfig();

          if (
            babelLoaderOptions &&
            lodash.isEqual(
              getDefaultBabelOptions(config, api.context),
              babelLoaderOptions,
            )
          ) {
            chain.module.rule(CHAIN_ID.RULE.JS).uses.delete(CHAIN_ID.USE.BABEL);
          }
        }
      },
      // other plugins can modify babel config in modifyBundlerChain 'default order'
      order: 'post',
    });
  },
});
