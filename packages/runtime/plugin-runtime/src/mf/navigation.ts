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

/** Keep the Router stable when a dynamic parent changes the physical mount. */
export function createMountWindow(
  routerBase: string,
  getMountBase: () => string,
  getRouter: () => DataRouter | undefined,
  isHashRouter: () => boolean,
) {
  const translate = (value: string, from: string, to: string) => {
    const local = removeBasename(value, from);
    return local === undefined ? value : addBasename(local, to);
  };
  const projectHref = (href: string) => {
    if (isHashRouter()) {
      const index = href.indexOf('#');
      return `${href.slice(0, index + 1)}${translate(href.slice(index + 1), routerBase, getMountBase())}`;
    }
    return translate(href, routerBase, getMountBase());
  };
  const location = () => {
    const url = new URL(window.location.href);
    if (isHashRouter())
      url.hash = `#${translate(url.hash.slice(1), getMountBase(), routerBase)}`;
    else url.pathname = translate(url.pathname, getMountBase(), routerBase);
    return url;
  };
  const history = new Proxy(window.history, {
    get(target, property) {
      if (property === 'pushState' || property === 'replaceState')
        return (state: unknown, unused: string, href?: string | URL | null) => {
          const url = href == null ? href : new URL(href, window.location.href);
          if (url) {
            if (isHashRouter()) url.hash = projectHref(url.hash);
            else url.pathname = projectHref(url.pathname);
          }
          target[property](state, unused, url);
        };
      const value = Reflect.get(target, property);
      return typeof value === 'function' ? value.bind(target) : value;
    },
  });
  const popListeners = new Map<EventListener, EventListener>();
  let notifyingPeers = false;
  const mountWindow = new Proxy(window, {
    get(target, property) {
      if (property === 'location')
        return new Proxy(target.location, {
          get(current, key) {
            if (
              ['href', 'pathname', 'search', 'hash', 'origin'].includes(
                String(key),
              )
            )
              return Reflect.get(location(), key);
            const value = Reflect.get(current, key);
            return typeof value === 'function' ? value.bind(current) : value;
          },
        });
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
            const url = location();
            const next = browserLocation(url, isHashRouter());
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
      if (property === 'history') return history;
      const value = Reflect.get(target, property);
      return typeof value === 'function' ? value.bind(target) : value;
    },
  });
  return {
    window: mountWindow,
    projectHref,
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

/** Adapt Modern's Router and projected browser window to Core's coordinator. */
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
          location: {
            url: browserLocation(
              router.window?.location || window.location,
              isHashRouter(),
            ),
            key: window.history.state?.key ?? 'default',
          },
          hostUrl: browserLocation(window.location, isHashRouter()),
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
