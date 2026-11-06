import type React from 'react';
import { renderApplication } from '../application/server';
import { applicationDefinition, applicationURL } from './shared';
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
    definition: applicationDefinition(info),
    basename: info.memoryRoute ? '/' : info.basename,
    identifierPrefix: info.identifierPrefix,
    signal: info.signal,
    nonce: info.nonce,
    props: info.props,
    memoryRoute: info.memoryRoute,
  });
  return {
    stream: result.stream,
    hydration: result.hydration,
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
