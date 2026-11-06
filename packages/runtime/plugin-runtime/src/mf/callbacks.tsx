import React from 'react';
import {
  type ApplicationInstance,
  type ApplicationSnapshot,
  createApplication,
} from '../application';
import {
  applicationDefinition,
  applicationProps,
  applicationURL,
} from './shared';
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

type Instance = {
  app: ApplicationInstance;
  ready: Promise<void>;
  root: BridgeRoot;
};

// render and hydrate must find the same instance when Bridge later updates it.
const instances = new WeakMap<HTMLElement, Instance>();

function dispose(container: HTMLElement, instance: Instance) {
  if (instances.get(container) === instance) instances.delete(container);
  if (!instance.app.disposed) instance.app.destroy();
}

function containerElement(container?: HTMLElement | string): HTMLElement {
  const element =
    typeof container === 'string'
      ? document.getElementById(container)
      : container;
  if (!element) throw new Error('Modern Bridge requires a mount container.');
  return element;
}

function options(info: BridgeRenderInfo) {
  return {
    url: applicationURL(info, window.location.href),
    basename: info.memoryRoute ? '/' : info.basename,
    memoryRoute: info.memoryRoute,
    ...('navigation' in info ? { navigation: info.navigation } : {}),
    identifierPrefix: info.rootOptions?.identifierPrefix,
    props: applicationProps(info),
    signal: info.signal,
    onRecoverableError: info.rootOptions?.onRecoverableError,
  };
}

function initialize(
  element: React.ReactElement,
  container: HTMLElement,
  info: BridgeRenderInfo,
  hydration?: BridgeHydrateInfo,
): Promise<BridgeRoot> {
  const app = createApplication(element, {
    definition: applicationDefinition(info),
  });
  const instance: Instance = {
    app,
    ready: Promise.resolve(),
    root: {
      render(next) {
        if (!React.isValidElement(next))
          throw new Error('Modern Bridge requires a React element.');
        instance.ready = instance.ready
          .then(async () => {
            if (!instance.app.disposed) await app.update({ element: next });
          })
          .catch(error => {
            dispose(container, instance);
            info.rootOptions?.onRecoverableError?.(error);
          });
      },
      unmount() {
        dispose(container, instance);
      },
    },
  };
  instances.set(container, instance);
  const initializeApplication = (async () => {
    if (hydration) {
      if (!hydration.updates)
        throw new Error('Modern Bridge hydration requires a data stream');
      await app.hydrate(container, hydration.snapshot as ApplicationSnapshot, {
        signal: info.signal,
        onRecoverableError: info.rootOptions?.onRecoverableError,
        updates: hydration.updates,
        memoryRoute: info.memoryRoute,
        navigation: info.navigation,
      });
    } else {
      await app.mount(container, options(info));
    }
    info.signal?.throwIfAborted();
  })();
  instance.ready = initializeApplication.catch(error => {
    dispose(container, instance);
    throw error;
  });
  return instance.ready.then(() => instance.root);
}

/** Mount or update one full Modern application in the producer's React root. */
export async function render(
  element: React.ReactElement,
  container?: HTMLElement | string,
  info: BridgeRenderInfo = {},
): Promise<BridgeRoot> {
  info.signal?.throwIfAborted();
  const dom = containerElement(container);
  const current = instances.get(dom);
  if (!current || current.app.disposed) return initialize(element, dom, info);
  current.ready = current.ready
    .then(async () => {
      if (
        current.app.disposed ||
        instances.get(dom) !== current ||
        info.signal?.aborted
      )
        return;
      await current.app.update({
        element,
        props: applicationProps(info),
        ...('navigation' in info ? { navigation: info.navigation } : {}),
      });
    })
    .catch(error => {
      dispose(dom, current);
      throw error;
    });
  await current.ready;
  return current.root;
}

/** Restore this instance's router and loader data without using Host globals. */
export async function hydrate(
  element: React.ReactElement,
  container: HTMLElement,
  info: BridgeHydrateInfo,
): Promise<BridgeRoot> {
  info.signal?.throwIfAborted();
  const current = instances.get(container);
  if (current && !current.app.disposed)
    throw new Error('Bridge application is already mounted.');
  return initialize(element, container, info, info);
}

/** The MF build plugin selects mf/server for Node compilations. */
export async function renderStream(
  _element: React.ReactElement,
  _info: BridgeStreamInfo,
): Promise<BridgeStreamResult> {
  throw new Error('Modern Bridge renderStream requires the Node entry.');
}
