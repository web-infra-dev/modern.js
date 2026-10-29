import React, { useContext, useEffect, useMemo, useRef } from 'react';
import {
  ReactRemote as CoreReactRemote,
  type CreateReactRemoteOptions,
  type ReactRemoteProps,
  type BridgeNavigation,
} from '@module-federation/bridge-react/base';
import {
  UNSAFE_NavigationContext,
  UNSAFE_RouteContext,
  useLocation,
  useNavigate,
} from '@modern-js/runtime-utils/router';
import { addBasename, normalizeBasename, removeBasename } from './navigation';

/** The local route boundary, not the deepest global match or the splat location. */
function useMountBasename(explicit: string | undefined, infer: boolean) {
  const navigation = useContext(UNSAFE_NavigationContext);
  const { matches } = useContext(UNSAFE_RouteContext);
  if (explicit !== undefined) return normalizeBasename(explicit);
  if (!infer) return undefined;
  if (!navigation || !matches.length)
    throw new Error(
      'useRemoteBasename requires a Modern route context. Pass basename to createReactRemote outside a Modern route.',
    );
  const local = matches[matches.length - 1].pathnameBase;
  return normalizeBasename(addBasename(local, navigation.basename));
}

export function useRemoteBasename(explicit?: string) {
  return useMountBasename(explicit, true)!;
}

function RoutedRemote<P extends object>({
  props,
  inferBasename = false,
  ...options
}: ReactRemoteProps<P> & { inferBasename?: boolean }) {
  const basename = useMountBasename(options.basename, inferBasename);
  const context = useContext(UNSAFE_NavigationContext);
  const location = useLocation();
  const navigate = useNavigate();
  const fullLocation = addBasename(
    `${location.pathname}${location.search}${location.hash}`,
    context.basename,
  );
  const current = useRef({
    fullLocation,
    navigate,
    routerBase: context.basename,
    navigator: context.navigator,
  });
  current.current = {
    fullLocation,
    navigate,
    routerBase: context.basename,
    navigator: context.navigator,
  };
  const state = useMemo(() => {
    const listeners = new Set<() => void>();
    const adapter: BridgeNavigation = {
      createHref: to => current.current.navigator.createHref(to),
      getLocation: () => current.current.fullLocation,
      subscribe: listener => {
        listeners.add(listener);
        return () => {
          listeners.delete(listener);
        };
      },
      navigate: (to, next) => {
        if (typeof to === 'number') return current.current.navigate(to);
        const target = removeBasename(to, current.current.routerBase);
        if (target === undefined)
          throw new Error(
            'Remote navigation is outside the host Router basename.',
          );
        return current.current.navigate(target, next);
      },
    };
    return { adapter, listeners };
  }, []);
  useEffect(() => {
    for (const listener of state.listeners) listener();
  }, [state, fullLocation]);
  return (
    <CoreReactRemote
      {...options}
      basename={basename}
      navigation={
        options.navigation ??
        (basename !== undefined && !options.memoryRoute
          ? state.adapter
          : undefined)
      }
      props={props}
    />
  );
}

/** Generic consumption stays independent unless a mount prefix is supplied. */
export function ReactRemote<P extends object = Record<string, unknown>>(
  options: ReactRemoteProps<P>,
) {
  const context = useContext(UNSAFE_NavigationContext);
  return context ? (
    <RoutedRemote {...options} />
  ) : (
    <BrowserRemote {...options} />
  );
}

export function createReactRemote<P extends object = Record<string, unknown>>(
  options: CreateReactRemoteOptions,
): React.ComponentType<P> {
  return props => <ReactRemote {...options} props={props} />;
}

/** Use in the Modern route that owns the application's URL. */
export function createModernReactRemote<
  P extends object = Record<string, unknown>,
>(options: CreateReactRemoteOptions): React.ComponentType<P> {
  return props => <RoutedRemote {...options} inferBasename props={props} />;
}

/** Browser history compatibility for explicit mounts without a Modern Router. */
function BrowserRemote<P extends object>(options: ReactRemoteProps<P>) {
  const navigation = useMemo<BridgeNavigation>(
    () => ({
      getLocation: () =>
        `${window.location.pathname}${window.location.search}${window.location.hash}`,
      subscribe: listener => {
        window.addEventListener('popstate', listener);
        return () => window.removeEventListener('popstate', listener);
      },
      navigate: (to, next) => {
        if (typeof to === 'number') {
          window.history.go(to);
          return;
        }
        if (!to.startsWith('/') || to.startsWith('//'))
          throw new Error(
            'Remote navigation requires an absolute local pathname.',
          );
        if (next?.replace)
          window.history.replaceState(window.history.state, '', to);
        else window.history.pushState(null, '', to);
        window.dispatchEvent(
          new PopStateEvent('popstate', { state: window.history.state }),
        );
      },
    }),
    [],
  );
  return (
    <CoreReactRemote
      {...options}
      navigation={
        options.navigation ??
        (options.basename !== undefined && !options.memoryRoute
          ? navigation
          : undefined)
      }
    />
  );
}
