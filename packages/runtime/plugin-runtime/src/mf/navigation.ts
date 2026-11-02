import {
  createBridgeRouterConnector,
  type BridgeNavigation,
  type BridgeRouterAdapter,
} from '@module-federation/bridge-react/base';
import type { DataRouter } from '@modern-js/runtime-utils/router';

export function normalizeBasename(value: string) {
  if (!value.startsWith('/') || value.includes('//') || /[?#\\]/.test(value))
    throw new Error(
      'Remote basename must be an absolute pathname without query or hash.',
    );
  return value.replace(/\/+$/, '') || '/';
}

/** Strip only a complete pathname prefix. Search, hash and encoded segments survive. */
export function removeBasename(
  url: string,
  basename: string,
): string | undefined {
  const base = normalizeBasename(basename);
  if (base === '/') return url;
  if (!url.toLowerCase().startsWith(base.toLowerCase())) return;
  const suffix = url.slice(base.length);
  if (suffix && !['/', '?', '#'].includes(suffix[0])) return;
  return suffix.startsWith('/') ? suffix : `/${suffix}`;
}

export function addBasename(url: string, basename: string) {
  const base = normalizeBasename(basename);
  if (base === '/') return url;
  return `${base}${url === '/' ? '' : /^\/[?#]/.test(url) ? url.slice(1) : url}`;
}

function browserLocation(
  location: Window['location'] | URL,
  hashRouter: boolean,
) {
  if (!hashRouter)
    return `${location.pathname}${location.search}${location.hash}`;
  const value = location.hash.slice(1) || '/';
  return value.startsWith('/') || value.startsWith('.') ? value : `/${value}`;
}

/** Adapt POP events per mount without changing browser locations or history. */
export function createMountWindow(
  getRouter: () => DataRouter | undefined,
  isHashRouter: () => boolean,
) {
  const popListeners = new Map<EventListener, EventListener>();
  let notifyingPeers = false;
  const mountWindow = new Proxy(window, {
    get(target, property) {
      if (property === 'addEventListener')
        return (
          type: string,
          listener: EventListener,
          options?: AddEventListenerOptions,
        ) => {
          if (type !== 'popstate')
            return target.addEventListener(type, listener, options);
          const wrapped: EventListener = event => {
            if (notifyingPeers) return;
            const router = getRouter();
            const next = browserLocation(target.location, isHashRouter());
            const pending = router?.state.navigation.location;
            const current = pending ?? router?.state.location;
            // Both peers and native history can repeat a POP while its loader
            // is pending. A new entry with the same URL still has a new key.
            if (
              current &&
              `${current.pathname}${current.search}${current.hash}` === next &&
              current.key === (target.history.state?.key ?? 'default')
            )
              return;
            listener(event);
          };
          popListeners.set(listener, wrapped);
          target.addEventListener(type, wrapped, options);
        };
      if (property === 'dispatchEvent')
        return (event: Event) => {
          for (const listener of popListeners.values()) listener(event);
          return true;
        };
      if (property === 'removeEventListener')
        return (
          type: string,
          listener: EventListener,
          options?: EventListenerOptions,
        ) => {
          target.removeEventListener(
            type,
            popListeners.get(listener) ?? listener,
            options,
          );
          popListeners.delete(listener);
        };
      const value = Reflect.get(target, property);
      return typeof value === 'function' ? value.bind(target) : value;
    },
  });
  return {
    window: mountWindow,
    notifyPeers() {
      // Publishing an already committed entry must not interrupt this writer's
      // next navigation. Other mounted Routers still receive the same POP.
      notifyingPeers = true;
      try {
        window.dispatchEvent(
          new PopStateEvent('popstate', { state: window.history.state }),
        );
      } finally {
        notifyingPeers = false;
      }
    },
  };
}

/** Adapt Modern's Router and browser history to Core's coordinator. */
export function createBrowserRouterConnector(
  host: BridgeNavigation | undefined,
  onError: (error: unknown) => void,
  isHashRouter: () => boolean = () => false,
  notifyPeers?: () => void,
) {
  let previousHost: BridgeNavigation | undefined;
  let adaptedHost:
    Pick<BridgeNavigation, 'getLocation' | 'subscribe'> | undefined;
  const adaptHost = (navigation: BridgeNavigation | undefined) => {
    if (navigation === previousHost) return adaptedHost;
    previousHost = navigation;
    adaptedHost = navigation && {
      subscribe: listener => navigation.subscribe(listener),
      getLocation: () => {
        const target = navigation.getLocation();
        const href = navigation.createHref?.(target);
        if (
          href !== undefined &&
          (new URL(href, window.location.href).hash.slice(1) === target) !==
            isHashRouter()
        )
          throw new Error(
            'URL-connected Host and Remote must use the same Browser or Hash Router mode. Configure the producer router or use an explicit memoryRoute card.',
          );
        return target;
      },
    };
    return adaptedHost;
  };
  const connector = createBridgeRouterConnector({
    navigation: adaptHost(host),
    onError,
  });
  return {
    attach(router: DataRouter) {
      const location = (value: DataRouter['state']['location']) => ({
        url: `${value.pathname}${value.search}${value.hash}`,
        key: value.key,
      });
      const pop = () =>
        new PopStateEvent('popstate', { state: window.history.state });
      const adapter: BridgeRouterAdapter = {
        getSnapshot: () => ({
          location: location(router.state.location),
          pendingLocation: router.state.navigation.location
            ? location(router.state.navigation.location)
            : undefined,
          action: router.state.historyAction,
          initialized: router.state.initialized,
        }),
        subscribe: listener => router.subscribe(listener),
        getHistoryLocation: () => ({
          url: browserLocation(window.location, isHashRouter()),
          key: window.history.state?.key ?? 'default',
        }),
        syncFromHistory: () => router.window?.dispatchEvent(pop()),
        notifyPeers: notifyPeers ?? (() => window.dispatchEvent(pop())),
      };
      connector.attach(adapter);
    },
    setNavigation(navigation: BridgeNavigation | undefined) {
      connector.setNavigation(adaptHost(navigation));
    },
    dispose: () => connector.dispose(),
  };
}
