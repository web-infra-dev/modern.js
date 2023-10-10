import { mapValues } from '@modern-js/utils/lodash';
import type {
  GlobalVars,
  DefaultBuilderPlugin,
} from '@modern-js/builder-shared';

export const builderPluginDefine = (): DefaultBuilderPlugin => ({
  name: 'builder-plugin-define',

  async setup(api) {
    api.modifyBundlerChain(
      async (chain, { env, target, CHAIN_ID, bundler }) => {
        const { getNodeEnv, removeTailSlash, applyOptionsChain } = await import(
          '@modern-js/utils'
        );
        const config = api.getNormalizedConfig();
        const publicPath = chain.output.get('publicPath');
        const assetPrefix =
          publicPath && typeof publicPath === 'string'
            ? publicPath
            : config.output.assetPrefix;

        const builtinVars: GlobalVars = {
          'process.env.NODE_ENV': getNodeEnv(),
          'process.env.ASSET_PREFIX': removeTailSlash(assetPrefix),
        };
        // Serialize global vars. User can customize value of `builtinVars`.
        const globalVars = applyOptionsChain(
          builtinVars,
          config.source.globalVars,
          { env, target },
        );

        const serializedVars = mapValues(
          globalVars,
          value => JSON.stringify(value) ?? 'undefined',
        );
        // Macro defines.
        // @ts-expect-error
        const defineExprs = config.source.define;

        chain
          .plugin(CHAIN_ID.PLUGIN.DEFINE)
          .use(bundler.DefinePlugin, [{ ...serializedVars, ...defineExprs }]);
      },
    );
  },
});
