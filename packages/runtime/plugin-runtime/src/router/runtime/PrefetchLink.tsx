'use client';
import {
  type Path,
  type RouteObject,
  Link as RouterLink,
  type LinkProps as RouterLinkProps,
  NavLink as RouterNavLink,
  type NavLinkProps as RouterNavLinkProps,
  matchRoutes,
  UNSAFE_NavigationContext,
  useMatches,
  useLocation,
  useResolvedPath,
} from '@modern-js/runtime-utils/router';
import React, { useContext, useEffect, useMemo } from 'react';
import type {
  FocusEventHandler,
  MouseEventHandler,
  TouchEventHandler,
} from 'react';
import { InternalRuntimeContext } from '../../core/context';
import type { TInternalRuntimeContext } from '../../core/context/runtime';
import type { ModernRouteObject, RouteAssets } from './types';

interface PrefetchHandlers {
  onFocus?: FocusEventHandler<Element>;
  onBlur?: FocusEventHandler<Element>;
  onMouseEnter?: MouseEventHandler<Element>;
  onMouseLeave?: MouseEventHandler<Element>;
  onTouchStart?: TouchEventHandler<Element>;
}

function composeEventHandlers<EventType extends React.SyntheticEvent | Event>(
  theirHandler: ((event: EventType) => any) | undefined,
  ourHandler: (event: EventType) => any,
): (event: EventType) => any {
  return event => {
    theirHandler?.(event);
    if (!event.defaultPrevented) {
      ourHandler(event);
    }
  };
}

/**
 * Modified from https://github.com/remix-run/remix/blob/9a0601bd704d2f3ee622e0ddacab9b611eb0c5bc/packages/remix-react/components.tsx#L218
 *
 * MIT Licensed
 * Author Michael Jackson
 * Copyright 2021 Remix Software Inc.
 * https://github.com/remix-run/remix/blob/2b5e1a72fc628d0408e27cf4d72e537762f1dc5b/LICENSE.md
 */
/**
 * Defines the prefetching behavior of the link:
 *
 * - "intent": Fetched when the user focuses or hovers the link
 * - "render": Fetched when the link is rendered
 * - "none": Never fetched
 */
type PrefetchBehavior = 'intent' | 'render' | 'none';
const ABSOLUTE_URL_REGEX = /^(?:[a-z][a-z0-9+.-]*:|\/\/)/i;
export interface LinkProps extends RouterLinkProps {
  prefetch?: PrefetchBehavior;
}
export interface NavLinkProps extends RouterNavLinkProps {
  prefetch?: PrefetchBehavior;
}

/**
 * Modified from https://github.com/remix-run/remix/blob/9a0601bd704d2f3ee622e0ddacab9b611eb0c5bc/packages/remix-react/components.tsx#L236
 *
 * MIT Licensed
 * Author Michael Jackson
 * Copyright 2021 Remix Software Inc.
 * https://github.com/remix-run/remix/blob/2b5e1a72fc628d0408e27cf4d72e537762f1dc5b/LICENSE.md
 */
function usePrefetchBehavior(
  prefetch: PrefetchBehavior,
  theirElementProps: PrefetchHandlers,
): [boolean, Required<PrefetchHandlers>] {
  const [maybePrefetch, setMaybePrefetch] = React.useState(false);
  const [shouldPrefetch, setShouldPrefetch] = React.useState(false);
  const { onFocus, onBlur, onMouseEnter, onMouseLeave, onTouchStart } =
    theirElementProps;

  React.useEffect(() => {
    if (prefetch === 'render') {
      setShouldPrefetch(true);
    }
  }, [prefetch]);

  const setIntent = () => {
    if (prefetch === 'intent') {
      setMaybePrefetch(true);
    }
  };

  const cancelIntent = () => {
    if (prefetch === 'intent') {
      setMaybePrefetch(false);
      setShouldPrefetch(false);
    }
  };

  React.useEffect(() => {
    if (maybePrefetch) {
      const id = setTimeout(() => {
        setShouldPrefetch(true);
      }, 100);
      return () => {
        clearTimeout(id);
      };
    }
  }, [maybePrefetch]);

  return [
    shouldPrefetch,
    {
      onFocus: composeEventHandlers(onFocus, setIntent),
      onBlur: composeEventHandlers(onBlur, cancelIntent),
      onMouseEnter: composeEventHandlers(onMouseEnter, setIntent),
      onMouseLeave: composeEventHandlers(onMouseLeave, cancelIntent),
      onTouchStart: composeEventHandlers(onTouchStart, setIntent),
    },
  ];
}

async function loadRouteModule(
  route: RouteObject,
  routeAssets: RouteAssets,
  loadChunk?: (chunkId: string | number) => Promise<unknown>,
): Promise<void> {
  const routeId = route.id;
  if (!routeId) {
    return;
  }

  if (!routeAssets[routeId]) {
    return;
  }

  const { chunkIds } = routeAssets[routeId];

  if (!chunkIds || !loadChunk) {
    return;
  }

  try {
    await Promise.all(chunkIds.map(chunkId => loadChunk(chunkId)));
  } catch (error) {
    console.error(error);
  }
}

const PrefetchPageLinks: React.FC<{ path: Path }> = ({ path }) => {
  const { pathname } = path;
  const context = useContext(InternalRuntimeContext);
  const { routeManifest, routes, _routeScope: scope } = context;
  const { routeAssets } = routeManifest || {};
  const matches = useMemo(
    () => (Array.isArray(routes) ? matchRoutes(routes, pathname) : []),
    [routes, pathname],
  );
  useEffect(() => {
    if (!Array.isArray(matches) || !routeAssets) return;
    // Chunk IDs belong to the producer compilation. The runtime package itself
    // may be shared, so scoped applications also supply their own chunk loader.
    const loadChunk = scope
      ? scope.loadRouteChunk
      : // @ts-ignore Replaced with the current bundler's chunk loader.
        WEBPACK_CHUNK_LOAD;
    matches.forEach(match =>
      loadRouteModule(match.route, routeAssets, loadChunk),
    );
  }, [matches, routeAssets, scope]);

  const serverLoaders = scope ? scope.serverLoaders : Boolean(context.ssr);
  if (!serverLoaders) return null;

  return <PrefetchDataLinks matches={matches} path={path} context={context} />;
};

const PrefetchDataLinks: React.FC<{
  matches: ReturnType<typeof matchRoutes>;
  path: Path;
  context: TInternalRuntimeContext;
}> = ({ matches, path, context }) => {
  const { pathname, search, hash } = path;
  const currentMatches = useMatches();
  const currentLocation = useLocation();
  const navigation = useContext(UNSAFE_NavigationContext);
  const scope = context._routeScope;
  const basename = scope ? scope.basename || '/' : navigation.basename;
  const dataHrefs = useMemo(() => {
    const routeUrl = (path: Path) =>
      new URL(
        `${basename === '/' ? '' : basename.replace(/\/$/, '')}${path.pathname}${path.search}${path.hash}`,
        window.location.origin,
      );
    return matches
      ?.filter((match, index) => {
        const route = match.route as ModernRouteObject;
        if (
          route.hasClientLoader ||
          typeof route.loader !== 'function' ||
          route.loader.length === 0
        ) {
          return false;
        }

        if (route.shouldRevalidate) {
          const shouldLoad = route.shouldRevalidate({
            currentUrl: routeUrl(currentLocation),
            currentParams: currentMatches[0]?.params || {},
            nextUrl: routeUrl(path),
            nextParams: match.params,
            defaultShouldRevalidate: true,
          });

          if (typeof shouldLoad === 'boolean') return shouldLoad;
        }

        const currentMatch = currentMatches[index];
        if (!currentMatch || currentMatch.id !== route.id) return true;
        if (currentMatch.pathname !== match.pathname) return true;
        if (
          currentMatch.pathname.endsWith('*') &&
          currentMatch.params['*'] !== match.params['*']
        )
          return true;
        return currentLocation.search !== search;
      })
      .map(match => {
        const mountedUrl = routeUrl(path);
        const url = scope?.getDataUrl
          ? scope.getDataUrl(mountedUrl)
          : mountedUrl;
        url.hash = '';
        url.searchParams.append('__loader', match.route.id!);
        url.searchParams.append('__ssrDirect', 'true');
        const href = url.toString();
        return <link key={href} rel="prefetch" as="fetch" href={href} />;
      });
  }, [
    matches,
    pathname,
    search,
    hash,
    basename,
    scope,
    currentMatches,
    currentLocation,
  ]);

  return <>{dataHrefs}</>;
};

type InputLinkProps<T> = T extends typeof RouterNavLink
  ? NavLinkProps
  : T extends typeof RouterLink
    ? LinkProps
    : never;

const createPrefetchLink = <T extends typeof RouterLink | typeof RouterNavLink>(
  Link: T,
) => {
  return React.forwardRef<HTMLAnchorElement, InputLinkProps<T>>(
    ({ to, prefetch = 'none', ...props }, forwardedRef) => {
      const isAbsolute = typeof to === 'string' && ABSOLUTE_URL_REGEX.test(to);
      const [shouldPrefetch, prefetchHandlers] = usePrefetchBehavior(
        prefetch,
        props,
      );

      const resolvedPath = useResolvedPath(to);
      return (
        <>
          <Link
            ref={forwardedRef}
            to={to}
            {...(props as any)}
            {...prefetchHandlers}
          />
          {shouldPrefetch && !isAbsolute ? (
            <PrefetchPageLinks path={resolvedPath} />
          ) : null}
        </>
      );
    },
  );
};

const Link = createPrefetchLink<typeof RouterLink>(RouterLink);
Link.displayName = 'Link';

const NavLink = createPrefetchLink<typeof RouterNavLink>(RouterNavLink);
NavLink.displayName = 'NavLink';

export { Link, NavLink };
