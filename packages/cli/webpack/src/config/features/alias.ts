import { applyOptionsChain, ensureAbsolutePath } from '@modern-js/utils';
import type { IAppContext, NormalizedConfig } from '@modern-js/core';
import type WebpackChain from '@modern-js/utils/webpack-chain';
import { getWebpackAliases } from '../../utils/getWebpackAliases';
import type { ResolveAlias } from '../base';

export function applyAlias({
  chain,
  config,
  appContext,
}: {
  chain: WebpackChain;
  appContext: IAppContext;
  config: NormalizedConfig;
}) {
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
