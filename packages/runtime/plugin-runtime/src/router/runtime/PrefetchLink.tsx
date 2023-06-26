import React, { useContext, useMemo } from 'react';
import type {
  FocusEventHandler,
  MouseEventHandler,
  TouchEventHandler,
} from 'react';
import {
  LinkProps as RouterLinkProps,
  RouteObject,
  Link as RouterLink,
  matchRoutes,
  useResolvedPath,
  useHref,
  useMatches,
  NavLink as RouterNavLink,
  NavLinkProps as RouterNavLinkProps,
} from '@modern-js/utils/runtime/router';
import { RuntimeReactContext } from '../../core';
import { RouteAssets, RouteManifest } from './types';

interface PrefetchHandlers {
  onFocus?: FocusEventHandler<Element>;
  onBlur?: FocusEventHandler<Element>;
  onMouseEnter?: MouseEventHandler<Element>;
  onMouseLeave?: MouseEventHandler<Element>;
  onTouchStart?: TouchEventHandler<Element>;
}

// TODO: 支持 rspack
declare const __webpack_chunk_load__:
  | ((chunkId: string) => Promise<void>)
  | undefined;

export function composeEventHandlers<
  EventType extends React.SyntheticEvent | Event,
>(
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

  // eslint-disable-next-line consistent-return
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
): Promise<string[] | void> {
  const routeId = route.id;
  if (!routeId) {
    return;
  }

  if (!routeAssets[routeId]) {
    return;
  }

  const { chunkIds } = routeAssets[routeId];

  if (!chunkIds) {
    return;
  }

  try {
    await Promise.all(
      chunkIds.map(chunkId => {
        return __webpack_chunk_load__?.(String(chunkId));
      }),
    );
  } catch (error) {
    console.error(error);
  }
}

const getRequestUrl = (pathname: string, routeId: string) => {
  const LOADER_ID_PARAM = '__loader';
  const DIRECT_PARAM = '__ssrDirect';
  const { protocol, host } = window.location;
  const url = new URL(pathname, `${protocol}//${host}`);
  url.searchParams.append(LOADER_ID_PARAM, routeId);
  url.searchParams.append(DIRECT_PARAM, 'true');
  return url;
};

const createDataHref = (href: string) => {
  return <link key={href} rel="prefetch" as="fetch" href={href} />;
};

const getDataHref = (
  route: RouteObject,
  pathname: string,
  basename: string,
) => {
  const { id } = route;

  const path = basename === '/' ? pathname : `${basename}${pathname}`;

  const url = getRequestUrl(path, id!);
  return createDataHref(url.toString());
};

const PrefetchPageLinks: React.FC<{ pathname: string }> = ({ pathname }) => {
  const context = useContext(RuntimeReactContext);
  const { routeManifest, routes } = context;
  const { routeAssets } = routeManifest || {};
  const matches = Array.isArray(routes) ? matchRoutes(routes, pathname) : [];
  if (Array.isArray(matches) && routeAssets) {
    matches?.forEach(match => loadRouteModule(match.route, routeAssets));
  }

  if (!window._SSR_DATA) {
    return null;
  }

  return (
    <PrefetchDataLinks
      matches={matches}
      pathname={pathname}
      routeManifest={routeManifest}
    />
  );
};

const PrefetchDataLinks: React.FC<{
  matches: ReturnType<typeof matchRoutes>;
  pathname: string;
  routeManifest: RouteManifest;
}> = ({ matches, pathname, routeManifest }) => {
  const currentMatches = useMatches();
  const basename = useHref('/');
  const dataHrefs = useMemo(() => {
    return matches
      ?.filter((match, index) => {
        if (
          !match.route.loader ||
          typeof match.route.loader !== 'function' ||
          match.route.loader.length === 0
        ) {
          return false;
        }

        // TODO: rewrite with shouldRevalidate
        const currentMatch = currentMatches[index];
        if (!currentMatch || currentMatch.id !== match.route.id) {
          return true;
        }
        if (currentMatch.pathname !== match.pathname) {
          return true;
        }
        if (
          currentMatch.pathname.endsWith('*') &&
          currentMatch.params['*'] !== match.params['*']
        ) {
          return true;
        }
        return false;
      })
      .map(match => getDataHref(match.route, pathname, basename));
  }, [matches, pathname, routeManifest]);

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
      const { pathname } = resolvedPath;
      return (
        <>
          <Link
            ref={forwardedRef}
            to={to}
            {...(props as any)}
            {...prefetchHandlers}
          />
          {shouldPrefetch && __webpack_chunk_load__ && !isAbsolute ? (
            <PrefetchPageLinks pathname={pathname} />
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
