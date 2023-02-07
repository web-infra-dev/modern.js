import type { BuilderPlugin, NormalizedConfig, WebpackChain } from '../types';
import { applyBuilderResolvePlugin } from '@modern-js/builder-shared';
import { ChainIdentifier } from '@modern-js/utils/chain-id';

// compatible with legacy packages with type="module"
// https://github.com/webpack/webpack/issues/11467
function applyFullySpecified({
  chain,
  config,
  CHAIN_ID,
}: {
  chain: WebpackChain;
  config: NormalizedConfig;
  CHAIN_ID: ChainIdentifier;
}) {
  chain.module
    .rule(CHAIN_ID.RULE.MJS)
    .test(/\.m?js/)
    .resolve.set('fullySpecified', false);

  if (config.source.compileJsDataURI) {
    chain.module
      .rule(CHAIN_ID.RULE.JS_DATA_URI)
      .resolve.set('fullySpecified', false);
  }
}
export const builderPluginResolve = (): BuilderPlugin => ({
  name: 'builder-plugin-resolve',

  setup(api) {
    applyBuilderResolvePlugin(api, async ({ chain, CHAIN_ID, extensions }) => {
      const { TsConfigPathsPlugin } = await import(
        '../webpackPlugins/TsConfigPathsPlugin'
      );

      (chain as unknown as WebpackChain).resolve
        .plugin(CHAIN_ID.RESOLVE_PLUGIN.TS_CONFIG_PATHS)
        .use(TsConfigPathsPlugin, [
          {
            cwd: api.context.rootPath,
            extensions,
          },
        ]);
    });

    api.modifyWebpackChain((chain, { CHAIN_ID }) => {
      const config = api.getNormalizedConfig();

      applyFullySpecified({ chain, config, CHAIN_ID });
    });
  },
});
