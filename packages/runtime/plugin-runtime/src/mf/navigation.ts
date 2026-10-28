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
  return base === '/' ? url : `${base}${url}`;
}

export function routerLocation(router: DataRouter) {
  const { pathname, search, hash } = router.state.location;
  return `${pathname}${search}${hash}`;
}

/** Connect an existing memory router. Host history is the navigation authority. */
export function connectRemoteRouter(
  router: DataRouter,
  basename: string,
  host: BridgeNavigation,
  onError: (error: unknown) => void,
) {
  let active = true;
  let revision = 0;
  let hostPending = false;
  let attached = false;
  let requested: string | undefined;
  const navigate = router.navigate;
  const report = (error: unknown) => {
    if (active) onError(error);
  };
  const forward = (replace: boolean) => {
    if (
      !active ||
      !attached ||
      hostPending ||
      router.state.navigation.state !== 'idle'
    )
      return;
    const target = addBasename(routerLocation(router), basename);
    if (target === host.getLocation() || target === requested) return;
    requested = target;
    const current = revision;
    Promise.resolve()
      .then(() => {
        if (active && attached && current === revision)
          return host.navigate(target, { replace });
      })
      .catch(report);
  };
  const sync = () => {
    if (!active) return;
    const target = removeBasename(host.getLocation(), basename);
    attached = target !== undefined;
    requested = undefined;
    const current = ++revision;
    hostPending = false;
    if (
      target === undefined ||
      (target === routerLocation(router) &&
        router.state.navigation.state === 'idle')
    )
      return;
    hostPending = true;
    Promise.resolve(navigate(target, { replace: true }))
      .then(() => {
        if (!active || current !== revision) return;
        hostPending = false;
        // A producer loader can redirect an incoming host location.
        forward(true);
      })
      .catch(report);
  };
  const wrappedNavigate: DataRouter['navigate'] = ((
    to: string | number,
    options?: any,
  ) => {
    if (!active || !attached) return Promise.resolve();
    ++revision;
    hostPending = false;
    if (typeof to === 'number') {
      return Promise.resolve()
        .then(() => {
          if (active) return host.navigate(to);
        })
        .catch(report);
    }
    return navigate(to, options);
  }) as DataRouter['navigate'];
  router.navigate = wrappedNavigate;
  const stopRouter = router.subscribe(() =>
    forward(router.state.historyAction !== 'PUSH'),
  );
  const stopHost = host.subscribe(sync);
  sync();
  return () => {
    active = false;
    ++revision;
    stopRouter();
    stopHost();
    if (router.navigate === wrappedNavigate) router.navigate = navigate;
  };
}
