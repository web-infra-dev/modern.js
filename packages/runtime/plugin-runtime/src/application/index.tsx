import React, { useEffect } from 'react';
import { type Root, createRoot, hydrateRoot } from 'react-dom/client';
import {
  type TInternalRuntimeContext,
  getGlobalApp,
  getGlobalInternalRuntimeContext,
  getInitialContext,
} from '../core/context';
import { wrapRuntimeContextProvider } from '../core/react/wrapper';
import type {
  ApplicationOptions,
  ApplicationRuntime,
  ApplicationSnapshot,
} from './types';

export type { ApplicationOptions, ApplicationSnapshot } from './types';

export interface ApplicationInstance {
  hydrate: (
    container: HTMLElement,
    snapshot: ApplicationSnapshot,
    options?: Pick<ApplicationOptions, 'signal' | 'onRecoverableError'>,
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
  let RootComponent: React.ComponentType<Record<string, unknown>>;
  let props: Record<string, unknown> = {};
  let removeAbortListener: (() => void) | undefined;
  let destroyed = false;
  let pending = false;
  let rejectCommit: ((error: unknown) => void) | undefined;
  let commit: () => void = () => {};
  let ready: Promise<void> = Promise.resolve();

  const destroy = () => {
    destroyed = true;
    rejectCommit?.(new Error('Application destroyed before commit'));
    removeAbortListener?.();
    context?._application?.router?.dispose();
    root?.unmount();
    root = undefined;
    context = undefined;
  };

  const initialize = async (
    container: HTMLElement,
    options: ApplicationOptions,
    snapshot?: ApplicationSnapshot,
  ) => {
    if (root || destroyed || pending)
      throw new Error('Application instance has already been used');
    pending = true;
    options.signal?.throwIfAborted();
    if (snapshot && snapshot.reactVersion !== React.version) {
      throw new Error(
        `Application React version mismatch: ${snapshot.reactVersion} / ${React.version}`,
      );
    }
    const url = new URL(options.url, window.location.href);
    props = options.props || {};
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
      <ApplicationCommit onCommit={commit}>
        <RootComponent {...props} />
      </ApplicationCommit>,
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
      if (snapshot.protocol !== 'modern-application/1') {
        return Promise.reject(
          new Error('Unsupported Modern application snapshot'),
        );
      }
      return initialize(container, { ...snapshot, ...options }, snapshot);
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
            <ApplicationCommit onCommit={commit}>
              <RootComponent {...props} />
            </ApplicationCommit>,
            context,
          ),
        );
      }
    },
    destroy,
  };
}
