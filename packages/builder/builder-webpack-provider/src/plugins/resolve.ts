import {
  TS_CONFIG_FILE,
  applyBuilderResolvePlugin,
} from '@modern-js/builder-shared';
import type { ChainIdentifier } from '@modern-js/utils/chain-id';
import type { BuilderPlugin, WebpackChain } from '../types';
import path from 'path';

async function applyTsConfigPathsPlugin({
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
  const { TsconfigPathsPlugin } = await import('tsconfig-paths-webpack-plugin');

  chain.resolve
    .plugin(CHAIN_ID.RESOLVE_PLUGIN.TS_CONFIG_PATHS)
    .use(TsconfigPathsPlugin, [
      {
        configFile: path.resolve(cwd, TS_CONFIG_FILE),
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

      if (config.source.compileJsDataURI) {
        chain.module
          .rule(CHAIN_ID.RULE.JS_DATA_URI)
          .resolve.set('fullySpecified', false);
      }

      if (isTsProject && config.source.aliasStrategy === 'prefer-tsconfig') {
        await applyTsConfigPathsPlugin({
          chain,
          CHAIN_ID,
          cwd: api.context.rootPath,
          extensions: chain.resolve.extensions.values(),
        });
      }
    });
  },
});
