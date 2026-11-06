import {
  disposeAfterError,
  disposeResources,
} from '../core/application/cleanup';
import { createBrowserRequestContext } from '../core/browser/data';
import React, { startTransition } from 'react';
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

const noop = () => {};

export interface ApplicationInstance {
  readonly disposed: boolean;
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
  destroy: (reason?: unknown) => void;
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
  let rejectPending: ((error: unknown) => void) | undefined;
  let commit: () => void = noop;
  let ready: Promise<void> | undefined;
  let data: ReturnType<typeof restoreApplicationData> | undefined;
  let finishHydration: (() => void) | undefined;
  let prepared: PreparedScope | undefined;
  let connection: ReturnType<typeof createBrowserRouterConnector> | undefined;

  const destroy = (reason?: unknown) => {
    if (destroyed) return;
    destroyed = true;
    const currentRoot = root;
    const currentData = data;
    const currentPrepared = prepared;
    const currentConnection = connection;
    const removeAbort = removeAbortListener;
    const rejectPendingCommit = rejectPending;
    root = undefined;
    context = undefined;
    data = undefined;
    prepared = undefined;
    connection = undefined;
    removeAbortListener = undefined;
    rejectPending = undefined;
    finishHydration = undefined;
    appElement = undefined;
    props = {};
    shellMarker = undefined;
    commit = noop;
    ready = undefined;
    disposeResources(
      () =>
        currentData?.cancel(
          reason ?? new Error('Application destroyed before data completed'),
        ),
      () =>
        rejectPendingCommit?.(
          reason ??
            new Error(
              !currentPrepared
                ? 'Application destroyed before initialization'
                : currentRoot
                  ? 'Application destroyed before commit'
                  : 'Application instance has been disposed',
            ),
        ),
      removeAbort,
      () => currentConnection?.dispose(),
      () => currentPrepared?.dispose(reason),
      () => currentRoot?.unmount(),
    );
  };

  const renderApplication = () => {
    const content = (
      <PreparedScopeContext.Provider value={prepared}>
        {appElement || <RootComponent {...props} />}
      </PreparedScopeContext.Provider>
    );
    return wrapRuntimeContextProvider(
      <ApplicationShell marker={shellMarker} onCommit={commit}>
        {content}
      </ApplicationShell>,
      context!,
    );
  };

  const initialize = async (
    container: HTMLElement,
    inputOptions: ApplicationOptions & { updates?: ReadableStream<unknown> },
    inputSnapshot?: ApplicationSnapshot,
  ) => {
    let options = inputOptions;
    let snapshot = inputSnapshot;
    if (destroyed || pending)
      throw new Error('Application instance has already been used');
    pending = true;
    const signal = inputOptions.signal;
    signal?.throwIfAborted();
    if (signal) {
      const onAbort = () => {
        try {
          destroy(signal?.reason);
        } catch (error) {
          (options.onRecoverableError || console.error)(error);
        }
      };
      signal.addEventListener('abort', onAbort, { once: true });
      removeAbortListener = () => signal?.removeEventListener('abort', onAbort);
    }
    // Install the owning abort subscription before yielding. No user setup
    // runs until the callback adapter has published its pending operation.
    await Promise.resolve();
    if (destroyed)
      throw (
        signal?.reason ??
        new Error('Application destroyed before initialization')
      );
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
        if (destroyed || signal?.aborted) return;
        if (root && rejectPending) rejectPending(error);
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
    const instance: PreparedScope = createScopeRuntime(config.definition, {
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
    prepared = instance;
    context = instance.context;
    const scope = context.application!;
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
                  instance.routeCommits?.routes.has(match.route.id),
                );
            if (match) {
              const kind = errorMatch ? 'error' : 'route';
              const observed = errorMatch
                ? instance.routeCommits?.errors
                : instance.routeCommits?.routes;
              initialRouteCommit = observed?.has(match.route.id)
                ? `${kind}:${match.route.id}`
                : undefined;
            }
            connection!.attach(router);
            resumeLocation();
          }
        : connection.attach;
      instance.setNavigation = connection.setNavigation;
      finishHydration = () => {
        if (!hydrating) return;
        hydrating = false;
        mountWindow.window.dispatchEvent(
          new PopStateEvent('popstate', { state: window.history.state }),
        );
      };
      resumeLocation = () => {
        if (!shellCommitted) return;
        if (!scope.router && instance.routeCommits?.routes.size) return;
        if (initialRouteCommit && !committedRoutes.has(initialRouteCommit))
          return;
        finishHydration?.();
      };
    }
    Object.assign(context, {
      ssr: Boolean(snapshot),
      initialData: snapshot?.initialData,
      __i18nData__: snapshot?.i18nData ? { ...snapshot.i18nData } : undefined,
      ssrContext: createBrowserRequestContext(url, undefined, 'stream'),
    });
    if (!appElement) RootComponent = createScopedRoot(config.definition);
    const preparation = await instance.prepare();
    if (preparation.interrupted) throw preparation.value;
    const assertActive = () => {
      signal?.throwIfAborted();
      if (destroyed)
        throw new Error('Application was destroyed before mounting');
    };
    assertActive();
    ready = new Promise<void>((resolve, reject) => {
      rejectPending = reject;
      commit = () => {
        shellCommitted = true;
        resumeLocation();
        rejectPending = undefined;
        resolve();
      };
    });
    const element = renderApplication();
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
    assertActive();
  };

  // One public operation owns preparation through React commit. Disposal
  // rejects it immediately, even when a user setup Promise has not settled.
  // The shared instance still owns all setup, context and Root preparation.
  const start: typeof initialize = (container, options, snapshot) =>
    new Promise<void>((resolve, reject) => {
      rejectPending = reject;
      // Always observe late completion after cancellation or replacement.
      initialize(container, options, snapshot).then(resolve, reject);
    }).catch(error => disposeAfterError(error, destroy));

  return {
    get disposed() {
      return destroyed;
    },
    hydrate(container, snapshot, options) {
      if (snapshot.protocol !== APPLICATION_SNAPSHOT_PROTOCOL) {
        return Promise.reject(
          new Error('Unsupported Modern application snapshot'),
        );
      }
      return start(container, { ...snapshot, ...options }, snapshot);
    },
    mount: (container, options) => start(container, options),
    async update(options) {
      await ready;
      if (!root || !context || !prepared)
        throw new Error('Application has not mounted');
      if ('navigation' in options)
        connection?.setNavigation(options.navigation);
      if (options.url && context.application?.memory) {
        const url = new URL(options.url, window.location.href);
        const pathname = `${url.pathname}${url.search}${url.hash}`;
        const router = context.application.router;
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
        const element = renderApplication();
        startTransition(() => currentRoot.render(element));
      }
    },
    destroy,
  };
}
