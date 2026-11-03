import React, { startTransition, useEffect } from 'react';
import { type Root, createRoot, hydrateRoot } from 'react-dom/client';
import { type TInternalRuntimeContext } from '../core/context';
import { createScopedRoot } from '../core/react/scope';
import {
  createScopeRuntime,
  PreparedScopeContext,
  type ScopedRootDefinition,
  type PreparedScope,
} from '../core/react/scopeDefinition';
import {
  createBrowserRouterConnector,
  createMountWindow,
} from '../mf/navigation';
import { wrapRuntimeContextProvider } from '../core/react/wrapper';
import { ApplicationShell } from './ApplicationShell';
import { restoreApplicationData } from './data';
import { APPLICATION_SNAPSHOT_PROTOCOL } from './constants';
import type { ApplicationOptions, ApplicationSnapshot } from './types';

export type { ApplicationOptions, ApplicationSnapshot } from './types';

export interface ApplicationInstance {
  hydrate: (
    container: HTMLElement,
    snapshot: ApplicationSnapshot,
    options: Pick<
      ApplicationOptions,
      'signal' | 'onRecoverableError' | 'memoryRoute' | 'navigation'
    > & {
      updates: ReadableStream<unknown>;
    },
  ) => Promise<void>;
  mount: (container: HTMLElement, options: ApplicationOptions) => Promise<void>;
  update: (
    options: Partial<
      Pick<ApplicationOptions, 'url' | 'props' | 'navigation'>
    > & {
      element?: React.ReactElement;
    },
  ) => Promise<void>;
  destroy: () => void;
}

function ApplicationCommit({
  children,
  onCommit,
}: {
  children: React.ReactNode;
  onCommit: () => void;
}) {
  useEffect(onCommit, [onCommit]);
  return <>{children}</>;
}

/** Restore and retain one existing Modern scope for this Bridge mount. */
export function createApplication(
  inputElement: React.ReactElement | undefined,
  config: { definition: ScopedRootDefinition },
): ApplicationInstance {
  let appElement = inputElement;
  let root: Root | undefined;
  let context: TInternalRuntimeContext | undefined;
  let shellMarker: string | undefined;
  let RootComponent: React.ComponentType<Record<string, unknown>>;
  let props: Record<string, unknown> = {};
  let removeAbortListener: (() => void) | undefined;
  let destroyed = false;
  let pending = false;
  let rejectInitialization: ((error: unknown) => void) | undefined;
  let rejectCommit: ((error: unknown) => void) | undefined;
  let commit: () => void = () => {};
  let ready: Promise<void> = Promise.resolve();
  let data: ReturnType<typeof restoreApplicationData> | undefined;
  let finishHydration: (() => void) | undefined;
  let prepared: PreparedScope;
  let connection: ReturnType<typeof createBrowserRouterConnector> | undefined;

  const destroy = () => {
    if (destroyed) return;
    destroyed = true;
    rejectInitialization?.(
      new Error('Application destroyed before initialization'),
    );
    data?.cancel(new Error('Application destroyed before data completed'));
    rejectCommit?.(new Error('Application destroyed before commit'));
    removeAbortListener?.();
    connection?.dispose();
    context?._routeScope?.router?.dispose();
    root?.unmount();
    root = undefined;
    context = undefined;
  };

  const initialize = async (
    container: HTMLElement,
    inputOptions: ApplicationOptions & { updates?: ReadableStream<unknown> },
    inputSnapshot?: ApplicationSnapshot,
  ) => {
    let options = inputOptions;
    let snapshot = inputSnapshot;
    if (root || destroyed || pending)
      throw new Error('Application instance has already been used');
    pending = true;
    options.signal?.throwIfAborted();
    const cancelled = new Promise<never>((_, reject) => {
      rejectInitialization = reject;
    });
    void cancelled.catch(() => {});
    if (options.signal) {
      options.signal.addEventListener('abort', destroy, { once: true });
      removeAbortListener = () =>
        options.signal?.removeEventListener('abort', destroy);
    }
    if (snapshot && snapshot.reactVersion !== React.version) {
      throw new Error(
        `Application React version mismatch: ${snapshot.reactVersion} / ${React.version}`,
      );
    }
    if (snapshot) {
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
    const committedRoutes = new Set<string>();
    let shellCommitted = false;
    let initialRouteCommit: string | undefined;
    let resumeLocation = () => {};
    props = options.props || {};
    shellMarker = snapshot?.shellMarker;
    prepared = createScopeRuntime(config.definition, {
      isBrowser: true,
      basename: options.memoryRoute ? '/' : options.basename || '/',
      initialUrl:
        options.memoryRoute?.entryPath ??
        `${url.pathname}${url.search}${url.hash}`,
      memory: Boolean(options.memoryRoute),
      observeRouteCommits: Boolean(snapshot),
      onRouteCommit(id, error) {
        committedRoutes.add(`${error ? 'error' : 'route'}:${id}`);
        resumeLocation();
      },
    });
    context = prepared.context;
    const scope = context._routeScope!;
    scope.hydrationData = snapshot?.routerData;
    if (!scope.memory) {
      // The HTTP request has no fragment. Keep the first Browser Router render
      // identical to the server, while retaining the real Router and its early
      // subscriptions. After commit, consume the latest browser entry once.
      let hydrating = Boolean(snapshot);
      const initialHistoryState = window.history.state;
      const history = snapshot
        ? new Proxy(window.history, {
            get(target, property) {
              if (property === 'state' && hydrating && !scope.hash)
                return initialHistoryState;
              const value = Reflect.get(target, property);
              return typeof value === 'function' ? value.bind(target) : value;
            },
          })
        : window.history;
      const applicationWindow = snapshot
        ? new Proxy(window, {
            get(target, property) {
              if (property === 'location' && hydrating && !scope.hash)
                return url;
              if (property === 'history') return history;
              const value = Reflect.get(target, property);
              return typeof value === 'function' ? value.bind(target) : value;
            },
          })
        : window;
      const mountWindow = createMountWindow(
        () => scope.router,
        () => scope.hash === true,
        applicationWindow,
      );
      scope.getWindow = () => mountWindow.window;
      connection = createBrowserRouterConnector(
        options.navigation,
        error => options.onRecoverableError?.(error),
        () => scope.hash === true,
        mountWindow.notifyPeers,
        applicationWindow,
      );
      scope.onRouterCreated = snapshot
        ? router => {
            const { matches, errors } = router.state;
            const errorMatch = matches.find(match => errors?.[match.route.id]);
            const match =
              errorMatch ||
              [...matches]
                .reverse()
                .find(match =>
                  prepared.routeCommits?.routes.has(match.route.id),
                );
            if (match) {
              const kind = errorMatch ? 'error' : 'route';
              const observed = errorMatch
                ? prepared.routeCommits?.errors
                : prepared.routeCommits?.routes;
              initialRouteCommit = observed?.has(match.route.id)
                ? `${kind}:${match.route.id}`
                : undefined;
            }
            connection!.attach(router);
            resumeLocation();
          }
        : connection.attach;
      prepared.setNavigation = connection.setNavigation;
      finishHydration = () => {
        if (!hydrating) return;
        hydrating = false;
        mountWindow.window.dispatchEvent(
          new PopStateEvent('popstate', { state: window.history.state }),
        );
      };
      resumeLocation = () => {
        if (!shellCommitted) return;
        if (!scope.router && prepared.routeCommits?.routes.size) return;
        if (initialRouteCommit && !committedRoutes.has(initialRouteCommit))
          return;
        finishHydration?.();
      };
    }
    Object.assign(context, {
      initialData: snapshot?.initialData,
      __i18nData__: snapshot?.i18nData ? { ...snapshot.i18nData } : undefined,
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
    RootComponent = createScopedRoot(config.definition);
    await Promise.race([
      prepared.runtime.hooks.onBeforeRender.call(context),
      cancelled,
    ]);
    rejectInitialization = undefined;
    if (destroyed || options.signal?.aborted) {
      options.signal?.throwIfAborted();
      throw new Error('Application was destroyed before mounting');
    }
    ready = new Promise<void>((resolve, reject) => {
      rejectCommit = reject;
      commit = () => {
        shellCommitted = true;
        resumeLocation();
        rejectCommit = undefined;
        resolve();
      };
    });
    const element = wrapRuntimeContextProvider(
      snapshot?.shellMarker ? (
        <ApplicationShell marker={snapshot.shellMarker} onCommit={commit}>
          <PreparedScopeContext.Provider value={prepared}>
            {appElement || <RootComponent {...props} />}
          </PreparedScopeContext.Provider>
        </ApplicationShell>
      ) : (
        <ApplicationCommit onCommit={commit}>
          <PreparedScopeContext.Provider value={prepared}>
            {appElement || <RootComponent {...props} />}
          </PreparedScopeContext.Provider>
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
    await ready;
  };

  return {
    hydrate(container, snapshot, options) {
      if (snapshot.protocol !== APPLICATION_SNAPSHOT_PROTOCOL) {
        return Promise.reject(
          new Error('Unsupported Modern application snapshot'),
        );
      }
      return initialize(container, { ...snapshot, ...options }, snapshot).catch(
        error => {
          data?.cancel(error);
          destroy();
          throw error;
        },
      );
    },
    mount: (container, options) =>
      initialize(container, options).catch(error => {
        destroy();
        throw error;
      }),
    async update(options) {
      await ready;
      if (!root || !context) throw new Error('Application has not mounted');
      if ('navigation' in options)
        connection?.setNavigation(options.navigation);
      if (options.url && context._routeScope?.memory) {
        const url = new URL(options.url, window.location.href);
        const pathname = `${url.pathname}${url.search}${url.hash}`;
        const router = context._routeScope.router;
        const location =
          router?.state.navigation.location || router?.state.location;
        if (
          router &&
          location &&
          `${location.pathname}${location.search}${location.hash}` !== pathname
        )
          await router.navigate(pathname);
      }
      if (options.props || options.element) {
        if (options.element) appElement = options.element;
        props = { ...props, ...options.props };
        // Keep pending server boundaries eligible for hydration when the Host
        // updates props after the shell commits but before its data arrives.
        const currentRoot = root;
        const element = wrapRuntimeContextProvider(
          shellMarker ? (
            <ApplicationShell marker={shellMarker} onCommit={commit}>
              <PreparedScopeContext.Provider value={prepared}>
                {appElement || <RootComponent {...props} />}
              </PreparedScopeContext.Provider>
            </ApplicationShell>
          ) : (
            <ApplicationCommit onCommit={commit}>
              <PreparedScopeContext.Provider value={prepared}>
                {appElement || <RootComponent {...props} />}
              </PreparedScopeContext.Provider>
            </ApplicationCommit>
          ),
          context,
        );
        startTransition(() => currentRoot.render(element));
      }
    },
    destroy,
  };
}
