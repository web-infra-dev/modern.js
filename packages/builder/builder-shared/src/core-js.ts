import type WebpackChain from '@modern-js/utils/webpack-chain';
import { SharedNormalizedConfig, BundlerChain } from './types';
import { createVirtualModule } from './utils';

const enableCoreJsEntry = (
  config: SharedNormalizedConfig,
  isServer: boolean,
  isServiceWorker: boolean,
) => config.output.polyfill === 'entry' && !isServer && !isServiceWorker;

/** Add core-js-entry to every entries. */
export function addCoreJsEntry({
  chain,
  config,
  isServer,
  isServiceWorker,
}: {
  chain: BundlerChain | WebpackChain;
  config: SharedNormalizedConfig;
  isServer: boolean;
  isServiceWorker: boolean;
}) {
  if (enableCoreJsEntry(config, isServer, isServiceWorker)) {
    const entryPoints = Object.keys(chain.entryPoints.entries() || {});
    const coreJsEntry = createVirtualModule('import "core-js";');

    for (const name of entryPoints) {
      chain.entry(name).prepend(coreJsEntry);
    }
  }
}
