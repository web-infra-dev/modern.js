import React, { useEffect } from 'react';
import { type Root, createRoot, hydrateRoot } from 'react-dom/client';
import {
  type TInternalRuntimeContext,
  getGlobalApp,
  getGlobalInternalRuntimeContext,
  getInitialContext,
} from '../core/context';
import { wrapRuntimeContextProvider } from '../core/react/wrapper';
import { ApplicationShell } from './ApplicationShell';
import { restoreApplicationData } from './data';
import type {
  ApplicationOptions,
  ApplicationRuntime,
  ApplicationSnapshot,
  ApplicationSnapshotV2,
} from './types';

export type {
  ApplicationOptions,
  ApplicationSnapshot,
  ApplicationSnapshotV2,
} from './types';

export interface ApplicationInstance {
  hydrate: (
    container: HTMLElement,
    snapshot: ApplicationSnapshot | ApplicationSnapshotV2,
    options?: Pick<ApplicationOptions, 'signal' | 'onRecoverableError'> & {
      updates?: ReadableStream<unknown>;
    },
  ) => Promise<void>;
  mount: (container: HTMLElement, options: ApplicationOptions) => Promise<void>;
  update: (
    options: Partial<Pick<ApplicationOptions, 'url' | 'props'>>,
  ) => Promise<void>;
  destroy: () => void;
}

function ApplicationCommit({
  children,
  onCommit,
}: { children: React.ReactNode; onCommit: () => void }) {
  useEffect(onCommit, [onCommit]);
  return <>{children}</>;
}

/** A separate lifecycle and memory router for each embedded application. */
export function createApplication(): ApplicationInstance {
  let root: Root | undefined;
  let context: TInternalRuntimeContext | undefined;
  let shellMarker: string | undefined;
  let RootComponent: React.ComponentType<Record<string, unknown>>;
  let props: Record<string, unknown> = {};
  let removeAbortListener: (() => void) | undefined;
  let destroyed = false;
  let pending = false;
  let rejectCommit: ((error: unknown) => void) | undefined;
  let commit: () => void = () => {};
  let ready: Promise<void> = Promise.resolve();
  let data: ReturnType<typeof restoreApplicationData> | undefined;

  const destroy = () => {
    destroyed = true;
    data?.cancel(new Error('Application destroyed before data completed'));
    rejectCommit?.(new Error('Application destroyed before commit'));
    removeAbortListener?.();
    context?._application?.router?.dispose();
    root?.unmount();
    root = undefined;
    context = undefined;
  };

  const initialize = async (
    container: HTMLElement,
    inputOptions: ApplicationOptions & { updates?: ReadableStream<unknown> },
    inputSnapshot?: ApplicationSnapshot | ApplicationSnapshotV2,
  ) => {
    let options = inputOptions;
    let snapshot = inputSnapshot;
    if (root || destroyed || pending)
      throw new Error('Application instance has already been used');
    pending = true;
    options.signal?.throwIfAborted();
    if (snapshot && snapshot.reactVersion !== React.version) {
      throw new Error(
        `Application React version mismatch: ${snapshot.reactVersion} / ${React.version}`,
      );
    }
    if (snapshot?.protocol === 'modern-application/2') {
      if (!options.updates)
        throw new Error(
          'Progressive application hydration requires a data stream',
        );
      data = restoreApplicationData(snapshot, options.updates);
      snapshot = data.snapshot;
      options = { ...options, props: snapshot.props };
      void data.done.catch(error => {
        if (destroyed || options.signal?.aborted) return;
        if (rejectCommit) rejectCommit(error);
        else options.onRecoverableError?.(error);
      });
    }
    const url = new URL(options.url, window.location.href);
    props = options.props || {};
    shellMarker = snapshot?.shellMarker;
    const application: ApplicationRuntime = {
      url: `${url.pathname}${url.search}${url.hash}`,
      hydrationData: snapshot?.routerData,
      props,
    };
    context = getInitialContext(true, { routeAssets: {} });
    Object.assign(context, {
      _application: application,
      _internalRouterBaseName: options.basename || '/',
      initialData: snapshot?.initialData,
      // Plugins receive this instance's request, never the host's _SSR_DATA.
      ssrContext: {
        request: {
          url: url.href,
          pathname: url.pathname,
          query: Object.fromEntries(url.searchParams),
          params: {},
          headers: {},
          cookieMap: {},
          cookie: '',
          host: url.host,
          userAgent: navigator.userAgent,
          referer: document.referrer,
        },
        response: {},
        mode: 'stream',
      },
    });
    const hooks = getGlobalInternalRuntimeContext().hooks;
    RootComponent = hooks.wrapRoot.call(
      getGlobalApp()!,
    ) as typeof RootComponent;
    await hooks.onBeforeRender.call(context);
    if (destroyed || options.signal?.aborted) {
      options.signal?.throwIfAborted();
      throw new Error('Application was destroyed before mounting');
    }
    ready = new Promise<void>((resolve, reject) => {
      rejectCommit = reject;
      commit = () => {
        rejectCommit = undefined;
        resolve();
      };
    });
    const element = wrapRuntimeContextProvider(
      snapshot?.shellMarker ? (
        <ApplicationShell marker={snapshot.shellMarker} onCommit={commit}>
          <RootComponent {...props} />
        </ApplicationShell>
      ) : (
        <ApplicationCommit onCommit={commit}>
          <RootComponent {...props} />
        </ApplicationCommit>
      ),
      context,
    );
    const rootOptions = {
      identifierPrefix: options.identifierPrefix || '',
      onRecoverableError: options.onRecoverableError,
    };
    if (snapshot) {
      root = hydrateRoot(container, element, rootOptions);
    } else {
      root = createRoot(container, rootOptions);
      root.render(element);
    }
    if (options.signal) {
      options.signal.addEventListener('abort', destroy, { once: true });
      removeAbortListener = () =>
        options.signal?.removeEventListener('abort', destroy);
    }
    await ready;
  };

  return {
    hydrate(container, snapshot, options = {}) {
      if (
        snapshot.protocol !== 'modern-application/1' &&
        snapshot.protocol !== 'modern-application/2'
      ) {
        return Promise.reject(
          new Error('Unsupported Modern application snapshot'),
        );
      }
      return initialize(container, { ...snapshot, ...options }, snapshot).catch(
        error => {
          data?.cancel(error);
          throw error;
        },
      );
    },
    mount: initialize,
    async update(options) {
      await ready;
      if (!root || !context) throw new Error('Application has not mounted');
      if (options.url) {
        const url = new URL(options.url, window.location.href);
        const pathname = `${url.pathname}${url.search}${url.hash}`;
        context._application!.url = pathname;
        await context._application?.router?.navigate(pathname);
      }
      if (options.props) {
        props = { ...props, ...options.props };
        context = {
          ...context,
          _application: { ...context._application!, props },
        };
        root.render(
          wrapRuntimeContextProvider(
            shellMarker ? (
              <ApplicationShell marker={shellMarker} onCommit={commit}>
                <RootComponent {...props} />
              </ApplicationShell>
            ) : (
              <ApplicationCommit onCommit={commit}>
                <RootComponent {...props} />
              </ApplicationCommit>
            ),
            context,
          ),
        );
      }
    },
    destroy,
  };
}
