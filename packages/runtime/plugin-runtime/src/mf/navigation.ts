import type { BridgeNavigation } from '@module-federation/bridge-react/base';
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
  if (!url.startsWith(base)) return;
  const suffix = url.slice(base.length);
  if (suffix && !['/', '?', '#'].includes(suffix[0])) return;
  return suffix.startsWith('/') ? suffix : `/${suffix}`;
}

export function addBasename(url: string, basename: string) {
  const base = normalizeBasename(basename);
  if (base === '/') return url;
  return `${base}${url === '/' ? '' : /^\/[?#]/.test(url) ? url.slice(1) : url}`;
}

export function routerLocation(router: DataRouter) {
  const { pathname, search, hash } = router.state.location;
  return `${pathname}${search}${hash}`;
}

/** Keep the Router stable when a dynamic parent changes the physical mount. */
export function createMountWindow(
  routerBase: string,
  getMountBase: () => string,
  getRouter: () => DataRouter | undefined,
) {
  const translate = (value: string, from: string, to: string) => {
    const local = removeBasename(value, from);
    return local === undefined ? value : addBasename(local, to);
  };
  const projectHref = (href: string) => {
    if (href.startsWith('#/'))
      return `#${translate(href.slice(1), routerBase, getMountBase())}`;
    return translate(href, routerBase, getMountBase());
  };
  const location = () => {
    const url = new URL(window.location.href);
    url.pathname = translate(url.pathname, getMountBase(), routerBase);
    if (url.hash.startsWith('#/'))
      url.hash = `#${translate(url.hash.slice(1), getMountBase(), routerBase)}`;
    return url;
  };
  const history = new Proxy(window.history, {
    get(target, property) {
      if (property === 'pushState' || property === 'replaceState')
        return (state: unknown, unused: string, href?: string | URL | null) => {
          const url = href == null ? href : new URL(href, window.location.href);
          if (url) {
            url.pathname = projectHref(url.pathname);
            if (url.hash.startsWith('#/')) url.hash = projectHref(url.hash);
          }
          target[property](state, unused, url);
        };
      const value = Reflect.get(target, property);
      return typeof value === 'function' ? value.bind(target) : value;
    },
  });
  const popListeners = new Map<EventListener, EventListener>();
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
            const router = getRouter();
            const url = location();
            const next = router
              ?.createHref(router.state.location)
              .startsWith('#/')
              ? url.hash.slice(1) || '/'
              : url.pathname + url.search + url.hash;
            // A synthetic POP informs peers after a write. The writer already
            // has this location, so do not run its loaders a second time.
            if (
              router &&
              router.state.navigation.state === 'idle' &&
              routerLocation(router) === next &&
              router.state.location.key === target.history.state?.key
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
  return { window: mountWindow, projectHref };
}

/** Browser history owns writes. POP only notifies the other Router instances. */
export function connectBrowserRouter(
  router: DataRouter,
  basename: string,
  host: BridgeNavigation | undefined,
  onError: (error: unknown) => void,
) {
  let active = true;
  const physicalLocation = () => {
    const current = router.window?.location || window.location;
    return router.createHref(router.state.location).startsWith('#/')
      ? `${current.hash.slice(1) || '/'}`
      : `${current.pathname}${current.search}${current.hash}`;
  };
  const notify = () => {
    if (active)
      window.dispatchEvent(
        new PopStateEvent('popstate', { state: window.history.state }),
      );
  };
  let previous = router.state.location;
  const stopRouter = router.subscribe(state => {
    if (!active || state.navigation.state !== 'idle') return;
    const next = state.location;
    if (next === previous) return;
    previous = next;
    if (state.historyAction !== 'POP') notify();
  });
  const sync = () => {
    if (!active || !host) return;
    const target = host.getLocation();
    if (removeBasename(target, basename) === undefined) return;
    const href = host.createHref?.(target) ?? target;
    const browser = `${window.location.pathname}${window.location.search}${window.location.hash}`;
    if (
      href.startsWith('#/') !==
      router.createHref(router.state.location).startsWith('#/')
    ) {
      onError(
        new Error(
          'URL-connected Host and Remote must use the same Browser or Hash Router mode. Configure the producer router or use an explicit memoryRoute card.',
        ),
      );
      return;
    }
    if (
      physicalLocation() !== routerLocation(router) &&
      (href.startsWith('#/') || browser === target)
    )
      router.window?.dispatchEvent(
        new PopStateEvent('popstate', { state: window.history.state }),
      );
  };
  const stopHost = host?.subscribe(sync);
  sync();
  return () => {
    active = false;
    stopRouter();
    stopHost?.();
  };
}
