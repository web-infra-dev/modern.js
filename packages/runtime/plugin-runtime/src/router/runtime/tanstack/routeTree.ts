import type { NestedRoute, PageRoute } from '@modern-js/types';
import type { RouteObject } from '@modern-js/runtime-utils/router';
import type {
  AnyRoute,
  AnyRouter,
  RootRoute as TanstackRootRoute,
} from '@tanstack/react-router';
import { createRootRoute, createRoute, notFound, redirect } from '@tanstack/react-router';
import { DefaultNotFound } from '../DefaultNotFound';

function toTanstackPath(pathname: string): string {
  // TanStack Router uses `$param` and `$` (splat) style params.
  // Modern's conventional routing currently generates React Router style params (e.g. `:id`, `*`).
  //
  // We only convert the subset Modern generates today:
  // - `:id` -> `$id`
  // - `:id?` -> `{-$id}` (optional param)
  // - `*`   -> `$`
  return pathname
    .split('/')
    .map(segment => {
      if (!segment) {
        return segment;
      }
      if (segment === '*') {
        return '$';
      }
      if (segment.startsWith(':')) {
        const name = segment.slice(1);
        if (name.endsWith('?')) {
          return `{-$${name.slice(0, -1)}}`;
        }
        return `$${name}`;
      }
      return segment;
    })
    .join('/');
}

function isResponse(value: unknown): value is Response {
  return (
    value != null &&
    typeof value === 'object' &&
    typeof (value as any).status === 'number' &&
    typeof (value as any).headers === 'object'
  );
}

function isTanstackRedirect(value: unknown): boolean {
  return isResponse(value) && typeof (value as any).options === 'object';
}

const redirectStatusCodes = new Set([301, 302, 303, 307, 308]);
function isRedirectResponse(res: Response) {
  return redirectStatusCodes.has(res.status);
}

function throwTanstackRedirect(location: string) {
  const target = location || '/';
  // Prefer `to` for internal/relative redirects so basepath can be applied.
  // Use `href` for absolute redirects (external).
  try {
    void new URL(target);
    throw redirect({ href: target });
  } catch {
    throw redirect({ to: target });
  }
}

function mapParamsForModernLoader({
  modernRoute,
  params,
}: {
  modernRoute: NestedRoute | PageRoute;
  params: Record<string, string>;
}) {
  // React Router uses `*` for splat params, TanStack Router uses `_splat`.
  if (modernRoute.type === 'nested' && modernRoute.path?.includes('*')) {
    const { _splat, ...rest } = params as any;
    if (typeof _splat !== 'undefined') {
      return { ...rest, '*': _splat };
    }
    return rest;
  }
  return params;
}

function createModernRequest(input: string, signal: AbortSignal) {
  return new Request(input, { signal });
}

function wrapModernLoader(
  modernRoute: NestedRoute | PageRoute,
  modernLoader: ((args: any) => any) | undefined,
) {
  return async (ctx: any) => {
    try {
      if (typeof (modernRoute as any).lazyImport === 'function') {
        try {
          (modernRoute as any).lazyImport();
        } catch {}
      }

      const signal: AbortSignal =
        ctx?.abortController?.signal || ctx?.signal || new AbortController().signal;
      const baseRequest: Request | undefined =
        ctx?.context?.request instanceof Request ? ctx.context.request : undefined;

      const href =
        typeof ctx?.location === 'string'
          ? ctx.location
          : ctx?.location?.publicHref ||
            ctx?.location?.href ||
            ctx?.location?.url?.href ||
            '';

      const request = baseRequest
        ? new Request(baseRequest, { signal })
        : createModernRequest(href, signal);
      const params = mapParamsForModernLoader({
        modernRoute,
        params: ctx.params || {},
      });

      const result = modernLoader
        ? await modernLoader({
            request,
            params,
            context: ctx?.context?.requestContext,
          })
        : null;

      if (isResponse(result)) {
        if (isRedirectResponse(result)) {
          const location = result.headers.get('Location') || '/';
          throwTanstackRedirect(location);
        }
        if (result.status === 404) {
          throw notFound();
        }
      }

      return result;
    } catch (err) {
      if (isResponse(err)) {
        if (isTanstackRedirect(err)) {
          throw err;
        }
        if (isRedirectResponse(err)) {
          const location = err.headers.get('Location') || '/';
          throwTanstackRedirect(location);
        }
        if (err.status === 404) {
          throw notFound();
        }
      }
      throw err;
    }
  };
}

function isRouteObjectPathlessLayout(route: RouteObject) {
  return !route.path && !route.index;
}

function isRouteObjectSplatRoute(route: RouteObject) {
  return typeof route.path === 'string' && route.path.includes('*');
}

function mapParamsForRouteObjectLoader({
  route,
  params,
}: {
  route: RouteObject;
  params: Record<string, string>;
}) {
  if (isRouteObjectSplatRoute(route)) {
    const { _splat, ...rest } = params as any;
    if (typeof _splat !== 'undefined') {
      return { ...rest, '*': _splat };
    }
    return rest;
  }
  return params;
}

function wrapRouteObjectLoader(route: RouteObject) {
  const routeLoader = route.loader;
  if (typeof routeLoader !== 'function') {
    return undefined;
  }

  return async (ctx: any) => {
    try {
      const signal: AbortSignal =
        ctx?.abortController?.signal || ctx?.signal || new AbortController().signal;
      const baseRequest: Request | undefined =
        ctx?.context?.request instanceof Request ? ctx.context.request : undefined;

      const href =
        typeof ctx?.location === 'string'
          ? ctx.location
          : ctx?.location?.publicHref ||
            ctx?.location?.href ||
            ctx?.location?.url?.href ||
            '';

      const request = baseRequest
        ? new Request(baseRequest, { signal })
        : createModernRequest(href, signal);

      const params = mapParamsForRouteObjectLoader({
        route,
        params: ctx.params || {},
      });

      const result = await routeLoader({
        request,
        params,
        context: ctx?.context?.requestContext,
      } as any);

      if (isResponse(result)) {
        if (isRedirectResponse(result)) {
          const location = result.headers.get('Location') || '/';
          throwTanstackRedirect(location);
        }
        if (result.status === 404) {
          throw notFound();
        }
      }

      return result;
    } catch (err) {
      if (isResponse(err)) {
        if (isTanstackRedirect(err)) {
          throw err;
        }
        if (isRedirectResponse(err)) {
          const location = err.headers.get('Location') || '/';
          throwTanstackRedirect(location);
        }
        if (err.status === 404) {
          throw notFound();
        }
      }
      throw err;
    }
  };
}

function toRouteComponent(route: RouteObject): any {
  if (route.Component) {
    return route.Component as any;
  }
  const element = route.element;
  if (element) {
    return (() => element as any) as any;
  }
  return undefined;
}

function toErrorComponent(route: RouteObject): any {
  const anyRoute = route as any;
  if (anyRoute.ErrorBoundary) {
    return anyRoute.ErrorBoundary as any;
  }
  if (route.errorElement) {
    return (() => route.errorElement as any) as any;
  }
  return undefined;
}

function toPendingComponent(route: RouteObject): any {
  const anyRoute = route as any;
  return anyRoute.HydrateFallback || anyRoute.pendingComponent || undefined;
}

function createRouteStaticData(opts: {
  modernRouteId?: string;
  modernRouteAction?: unknown;
  modernRouteLoader?: unknown;
}) {
  const staticData: Record<string, unknown> = {};

  if (opts.modernRouteId) {
    staticData.modernRouteId = opts.modernRouteId;
  }

  if (opts.modernRouteAction) {
    staticData.modernRouteAction = opts.modernRouteAction;
  }

  if (opts.modernRouteLoader) {
    staticData.modernRouteLoader = opts.modernRouteLoader;
  }

  return Object.keys(staticData).length > 0 ? staticData : undefined;
}

function createRouteFromRouteObject(opts: {
  parent: AnyRoute;
  routeObject: RouteObject;
}): AnyRoute {
  const { parent, routeObject } = opts;

  const stableFallbackId =
    routeObject.id ||
    (routeObject as any).file ||
    (routeObject as any).path ||
    'pathless';

  const base: any = {
    getParentRoute: () => parent,
    component: toRouteComponent(routeObject),
    pendingComponent: toPendingComponent(routeObject),
    errorComponent: toErrorComponent(routeObject),
    wrapInSuspense: true,
    staticData: createRouteStaticData({
      modernRouteId: routeObject.id,
      modernRouteAction: routeObject.action,
      modernRouteLoader: routeObject.loader,
    }),
    loader: wrapRouteObjectLoader(routeObject),
  };

  if (isRouteObjectPathlessLayout(routeObject)) {
    base.id = stableFallbackId;
  } else {
    base.path = routeObject.index
      ? '/'
      : toTanstackPath((routeObject.path as string) || '');
  }

  const route = createRoute(base) as unknown as AnyRoute;

  const children = routeObject.children;
  if (children && children.length > 0) {
    const childRoutes = children.map(child =>
      createRouteFromRouteObject({ parent: route, routeObject: child }),
    );
    (route as any).addChildren(childRoutes);
  }

  return route;
}

function createRouteFromModernRoute(opts: {
  parent: AnyRoute;
  modernRoute: NestedRoute | PageRoute;
}): AnyRoute {
  const { parent, modernRoute } = opts;

  const modernId = (modernRoute as any).id as string | undefined;
  const stableFallbackId =
    modernId ||
    (modernRoute as any)._component ||
    (modernRoute as any).filename ||
    (modernRoute as any).data ||
    (modernRoute as any).loader;

  const pendingComponent =
    (modernRoute as any).loading || (modernRoute as any).pendingComponent;
  const errorComponent = (modernRoute as any).error || (modernRoute as any).errorComponent;
  const component = (modernRoute as any).component;
  const modernLoader = (modernRoute as any).loader;
  const modernAction = (modernRoute as any).action;

  // Pathless layout: no path segment, but must remain in the tree.
  const isPathlessLayout =
    modernRoute.type === 'nested' &&
    typeof modernRoute.index !== 'boolean' &&
    typeof (modernRoute as any).path === 'undefined';

  const isIndexRoute =
    modernRoute.type === 'nested' && Boolean((modernRoute as any).index);

  const base: any = {
    getParentRoute: () => parent,
    component: component || undefined,
    pendingComponent: pendingComponent || undefined,
    errorComponent: errorComponent || undefined,
    wrapInSuspense: true,
    staticData: createRouteStaticData({
      modernRouteId: modernId,
      modernRouteAction: modernAction,
      modernRouteLoader: modernLoader,
    }),
    loader: wrapModernLoader(modernRoute, modernLoader),
  };

  if (isPathlessLayout) {
    // Use a stable custom id for pathless layouts to avoid hydration mismatch.
    base.id = stableFallbackId || 'pathless';
  } else {
    const rawPath = (modernRoute as any).path as string | undefined;
    base.path = isIndexRoute ? '/' : toTanstackPath(rawPath || '');
  }

  const route = createRoute(base) as unknown as AnyRoute;

  const children = (modernRoute as any).children as
    | Array<NestedRoute | PageRoute>
    | undefined;
  if (children && children.length > 0) {
    const childRoutes = children.map(child =>
      createRouteFromModernRoute({ parent: route, modernRoute: child }),
    );
    (route as any).addChildren(childRoutes);
  }

  return route;
}

export function createRouteTreeFromModernRoutes(
  routes: Array<NestedRoute | PageRoute>,
): TanstackRootRoute<any, any, any, any, any, any, any, any, any, any, any> {
  const rootModern = routes.find(
    r => r && (r as any).type === 'nested' && (r as any).isRoot,
  ) as NestedRoute | undefined;

  const rootComponent = (rootModern as any)?.component;
  const pendingComponent = (rootModern as any)?.loading;
  const errorComponent = (rootModern as any)?.error;
  const rootLoader = (rootModern as any)?.loader as
    | ((args: any) => any)
    | undefined;
  const rootAction = (rootModern as any)?.action;
  const rootModernId = (rootModern as any)?.id as string | undefined;

  const rootRoute = createRootRoute({
    component: rootComponent || undefined,
    pendingComponent: pendingComponent || undefined,
    errorComponent: errorComponent || undefined,
    wrapInSuspense: true,
    notFoundComponent: DefaultNotFound,
    staticData: createRouteStaticData({
      modernRouteId: rootModernId,
      modernRouteAction: rootAction,
      modernRouteLoader: rootLoader,
    }),
    loader: rootModern ? wrapModernLoader(rootModern, rootLoader) : undefined,
  }) as any;

  const topLevel = rootModern
    ? ((rootModern as any).children as Array<NestedRoute | PageRoute>) || []
    : routes;

  const childRoutes = topLevel.map(child =>
    createRouteFromModernRoute({ parent: rootRoute, modernRoute: child }),
  );

  (rootRoute as any).addChildren(childRoutes);
  return rootRoute as any;
}

function getRootLikeRouteObject(routes: RouteObject[]) {
  return routes.find(route => route.path === '/' && !route.index);
}

export function createRouteTreeFromRouteObjects(
  routes: RouteObject[],
): TanstackRootRoute<any, any, any, any, any, any, any, any, any, any, any> {
  const rootLikeRoute = getRootLikeRouteObject(routes);

  const rootRoute = createRootRoute({
    component: rootLikeRoute ? toRouteComponent(rootLikeRoute) : undefined,
    pendingComponent: rootLikeRoute
      ? toPendingComponent(rootLikeRoute)
      : undefined,
    errorComponent: rootLikeRoute ? toErrorComponent(rootLikeRoute) : undefined,
    wrapInSuspense: true,
    notFoundComponent: DefaultNotFound,
    staticData: createRouteStaticData({
      modernRouteId: rootLikeRoute?.id,
      modernRouteAction: rootLikeRoute?.action,
      modernRouteLoader: rootLikeRoute?.loader,
    }),
    loader: rootLikeRoute ? wrapRouteObjectLoader(rootLikeRoute) : undefined,
  }) as any;

  const topLevel = rootLikeRoute
    ? [
        ...((rootLikeRoute.children as RouteObject[] | undefined) || []),
        ...routes.filter(route => route !== rootLikeRoute),
      ]
    : routes;

  const childRoutes = topLevel.map(routeObject =>
    createRouteFromRouteObject({ parent: rootRoute, routeObject }),
  );

  (rootRoute as any).addChildren(childRoutes);
  return rootRoute as any;
}

export function getModernRouteIdsFromMatches(
  router: AnyRouter,
): string[] {
  const matches = router.state.matches || [];
  const ids = matches
    .map((m: any) => m.route?.options?.staticData?.modernRouteId)
    .filter(Boolean);
  return Array.from(new Set(ids));
}
