import type { BuilderPlugin, NormalizedConfig, WebpackChain } from '../types';
import { applyBuilderResolvePlugin } from '@modern-js/builder-shared';
import type { ChainIdentifier } from '@modern-js/utils/chain-id';

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

async function applyTsProject({
  chain,
  CHAIN_ID,
  cwd,
  extensions,
}: {
  chain: WebpackChain;
  CHAIN_ID: ChainIdentifier;
  cwd: string;
  extensions: string[];
}) {
  const { TsConfigPathsPlugin } = await import(
    '../webpackPlugins/TsConfigPathsPlugin'
  );

  chain.resolve
    .plugin(CHAIN_ID.RESOLVE_PLUGIN.TS_CONFIG_PATHS)
    .use(TsConfigPathsPlugin, [
      {
        cwd,
        extensions,
      },
    ]);
}

export const builderPluginResolve = (): BuilderPlugin => ({
  name: 'builder-plugin-resolve',

  setup(api) {
    applyBuilderResolvePlugin(api);

    api.modifyWebpackChain(async (chain, { CHAIN_ID }) => {
      const config = api.getNormalizedConfig();
      const isTsProject = Boolean(api.context.tsconfigPath);

      applyFullySpecified({ chain, config, CHAIN_ID });

      if (!isTsProject) {
        return;
      }

      await applyTsProject({
        chain,
        CHAIN_ID,
        cwd: api.context.rootPath,
        extensions: chain.resolve.extensions.values(),
      });
    });
  },
});
