import type React from 'react';
import { renderApplication } from '../application/server';
import { applicationURL } from './shared';
import type {
  BridgeHydrateInfo,
  BridgeRenderInfo,
  BridgeRoot,
  BridgeStreamInfo,
  BridgeStreamResult,
} from './types';

export type {
  BridgeHydrateInfo,
  BridgeRenderInfo,
  BridgeRoot,
  BridgeStreamInfo,
  BridgeStreamResult,
} from './types';

/** Run Modern's request hooks and loaders around the supplied application tree. */
export async function renderStream(
  element: React.ReactElement,
  info: BridgeStreamInfo,
): Promise<BridgeStreamResult> {
  const request = new Request(applicationURL(info, info.url), {
    headers: info.headers,
    signal: info.signal,
  });
  const result = await renderApplication(request, {
    element,
    progressiveHydration: true,
    basename: info.memoryRoute ? '/' : info.basename,
    identifierPrefix: info.identifierPrefix,
    signal: info.signal,
    nonce: info.nonce,
    props: info.props,
  });
  const revision = process.env.MODERN_BRIDGE_REVISION;
  const stamp = <T extends object>(snapshot: Promise<T>): Promise<T> =>
    revision
      ? snapshot.then(value => ({ ...value, bridgeRevision: revision }))
      : snapshot;
  return {
    revision,
    stream: result.stream,
    snapshot: stamp(result.snapshot),
    hydration: result.hydration && {
      ...result.hydration,
      snapshot: stamp(result.hydration.snapshot),
    },
    abort: result.cancel,
  };
}

export async function render(
  _element: React.ReactElement,
  _container?: HTMLElement | string,
  _info?: BridgeRenderInfo,
): Promise<BridgeRoot> {
  throw new Error('A Node Bridge application cannot mount into a DOM.');
}

export async function hydrate(
  _element: React.ReactElement,
  _container: HTMLElement,
  _info: BridgeHydrateInfo,
): Promise<BridgeRoot> {
  throw new Error('A Node Bridge application cannot hydrate a DOM.');
}
