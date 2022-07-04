import {
  CHAIN_ID,
  applyOptionsChain,
  ensureAbsolutePath,
} from '@modern-js/utils';
import { getWebpackAliases } from '../../utils/getWebpackAliases';
import type { ResolveAlias } from '../base';
import type { ChainUtils } from '../shared';

export function applyAlias({ chain, config, appContext }: ChainUtils) {
  //  resolve alias
  const defaultAlias: ResolveAlias = getWebpackAliases(appContext, config._raw);

  const alias = applyOptionsChain<ResolveAlias, undefined>(
    defaultAlias,
    config.source?.alias as ResolveAlias,
  );

  for (const name of Object.keys(alias)) {
    chain.resolve.alias.set(
      name,
      (
        (Array.isArray(alias[name]) ? alias[name] : [alias[name]]) as string[]
      ).map(value =>
        /**
         * - Relative paths need to be turned into absolute paths
         * - Absolute paths or a package name are not processed
         */
        value.startsWith('.')
          ? (ensureAbsolutePath(appContext.appDirectory, value) as any)
          : value,
      ) as any,
    );
  }
}

// aliases from tsconfig.json
export function applyTsConfigPathsPlugins({ chain, appContext }: ChainUtils) {
  const {
    TsConfigPathsPlugin,
  } = require('../../plugins/ts-config-paths-plugin');

  chain.resolve
    .plugin(CHAIN_ID.RESOLVE_PLUGIN.TS_CONFIG_PATHS)
    .use(TsConfigPathsPlugin, [appContext.appDirectory]);
}
