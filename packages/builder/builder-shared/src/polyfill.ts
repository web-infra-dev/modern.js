import { createVirtualModule, isWebTarget } from './utils';
import type {
  BuilderTarget,
  BundlerChain,
  SharedNormalizedConfig,
} from './types';
import type WebpackChain from '../compiled/webpack-5-chain';

/** Add core-js-entry to every entries. */
export function addCoreJsEntry({
  chain,
  config,
  target,
}: {
  chain: BundlerChain | WebpackChain;
  config: SharedNormalizedConfig;
  target: BuilderTarget;
}) {
  if (config.output.polyfill === 'entry' && isWebTarget(target)) {
    const entryPoints = Object.keys(chain.entryPoints.entries() || {});
    const coreJsEntry = createVirtualModule('import "core-js";');

    for (const name of entryPoints) {
      chain.entry(name).prepend(coreJsEntry);
    }
  }
}
