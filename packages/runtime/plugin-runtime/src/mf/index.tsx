import React from 'react';
import {
  type ApplicationInstance,
  type ApplicationSnapshot,
  type ApplicationSnapshotV2,
  createApplication,
} from '../application';
import { applicationProps, applicationURL } from './shared';
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
  disposed: boolean;
  ready: Promise<void>;
  root: BridgeRoot;
  removeAbortListener?: () => void;
};

// render and hydrate must find the same instance when Bridge later updates it.
const instances = new WeakMap<HTMLElement, Instance>();
const revision = process.env.MODERN_BRIDGE_REVISION;

function dispose(container: HTMLElement, instance: Instance) {
  if (instances.get(container) === instance) instances.delete(container);
  if (instance.disposed) return;
  instance.disposed = true;
  instance.removeAbortListener?.();
  instance.app.destroy();
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
    identifierPrefix: info.rootOptions?.identifierPrefix,
    props: applicationProps(info),
    signal: info.signal,
    onRecoverableError: info.rootOptions?.onRecoverableError,
  };
}

async function initialize(
  element: React.ReactElement,
  container: HTMLElement,
  info: BridgeRenderInfo,
  hydration?: BridgeHydrateInfo,
): Promise<BridgeRoot> {
  info.signal?.throwIfAborted();
  const app = createApplication(element);
  const instance: Instance = {
    app,
    disposed: false,
    ready: Promise.resolve(),
    root: {
      render(next) {
        if (!React.isValidElement(next))
          throw new Error('Modern Bridge requires a React element.');
        instance.ready = instance.ready
          .then(async () => {
            if (!instance.disposed) await app.update({ element: next });
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
  // Bridge has no root handle until this async callback resolves. Listen before
  // onBeforeRender so an unmount can cancel a pending hook and free the DOM for
  // a new instance without waiting for user code to settle.
  const aborted = new Promise<never>((_, reject) => {
    if (!info.signal) return;
    const abort = () => {
      dispose(container, instance);
      reject(info.signal!.reason || new Error('Bridge application aborted'));
    };
    info.signal.addEventListener('abort', abort, { once: true });
    instance.removeAbortListener = () =>
      info.signal?.removeEventListener('abort', abort);
  });
  const initializeApplication = Promise.resolve().then(async () => {
    if (instance.disposed) return;
    if (hydration) {
      await app.hydrate(
        container,
        hydration.snapshot as ApplicationSnapshot | ApplicationSnapshotV2,
        {
          signal: info.signal,
          onRecoverableError: info.rootOptions?.onRecoverableError,
          updates: hydration.updates,
        },
      );
    } else {
      await app.mount(container, options(info));
    }
    if (info.signal?.aborted) dispose(container, instance);
  });
  // race also observes a late failure of the abandoned hook, preventing an
  // unhandled rejection or disposal of the newer instance in the same DOM.
  instance.ready = Promise.race([initializeApplication, aborted]).catch(
    error => {
      dispose(container, instance);
      throw error;
    },
  );
  await instance.ready;
  return instance.root;
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
  if (!current) return initialize(element, dom, info);
  current.ready = current.ready
    .then(async () => {
      if (
        current.disposed ||
        instances.get(dom) !== current ||
        info.signal?.aborted
      )
        return;
      await current.app.update({ ...options(info), element });
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
  if (
    revision &&
    (info.snapshot as { bridgeRevision?: string })?.bridgeRevision !== revision
  ) {
    throw new Error('Bridge producer build revision mismatch.');
  }
  if (instances.has(container))
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
