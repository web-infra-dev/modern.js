import {
  ElementsContext,
  createFromReadableStream,
} from '@modern-js/render/client';
import {
  StaticRouterProvider,
  createStaticRouter,
} from '@modern-js/runtime-utils/node/router';
import {
  type RouteObject,
  createBrowserRouter,
  redirect,
} from '@modern-js/runtime-utils/router';
import React from 'react';
import type { PayloadRoute, ServerPayload } from '../../core/context';

const safeUse = (promise: any) => {
  if (typeof (React as any).use === 'function') {
    return (React as any).use(promise);
  }
  return null;
};

export interface RSCStaticRouterProps {
  basename?: string;
  useJsonScript?: boolean;
}

export const RSCStaticRouter: React.FC<RSCStaticRouterProps> = ({
  basename,
  useJsonScript,
}) => {
  const payload: ServerPayload = safeUse(safeUse(ElementsContext));

  if (!payload || payload.type !== 'render') {
    return null;
  }

  const routerContext = {
    actionData: payload.actionData,
    actionHeaders: {},
    activeDeferreds: {},
    basename: basename || '',
    errors: payload.errors,
    loaderData: payload.loaderData,
    loaderHeaders: {},
    location: payload.location,
    statusCode: 200,
    matches: payload.routes.map(match => ({
      params: match.params,
      pathname: match.pathname,
      pathnameBase: match.pathnameBase,
      route: {
        id: match.id,
        action: match.hasAction || !!match.clientAction,
        handle: match.handle,
        hasErrorBoundary: match.hasErrorBoundary,
        loader: match.hasLoader || !!match.clientLoader,
        index: match.index,
        path: match.path,
        shouldRevalidate: match.shouldRevalidate,
      },
    })),
  };

  const processedRoutes = payload.routes.reduceRight<PayloadRoute[]>(
    (previous, route) => {
      if (previous.length > 0) {
        return [
          {
            ...route,
            children: previous,
          },
        ];
      }
      return [route];
    },
    [],
  );

  const router = createStaticRouter(processedRoutes, routerContext);

  return (
    <>
      <StaticRouterProvider
        context={routerContext}
        router={router}
        hydrate={false}
      />
    </>
  );
};

function createRouteFromServerManifest(route: PayloadRoute): any {
  return {
    id: route.id,
    element: route.element,
    errorElement: route.errorElement,
    handle: route.handle,
    hasErrorBoundary: route.hasErrorBoundary,
    index: route.index,
    path: route.path,
    shouldRevalidate: route.shouldRevalidate,
    hasLoader: route.hasLoader,
    hasAction: route.hasAction,
    clientLoader: route.clientLoader,
    clientAction: route.clientAction,
    params: route.params,
    pathname: route.pathname,
    pathnameBase: route.pathnameBase,
    parentId: route.parentId,
  };
}

const mergeRoutes = (
  routes: PayloadRoute[],
  originalRoutes: any[] | undefined,
): any[] => {
  if (!originalRoutes || !Array.isArray(originalRoutes)) {
    return routes;
  }
  const routesMap = new Map<string, PayloadRoute>();

  const buildRoutesMap = (routesList: PayloadRoute[]) => {
    routesList.forEach(route => {
      if (route.id) {
        routesMap.set(route.id, route);
      }

      if (
        'children' in route &&
        route.children &&
        Array.isArray(route.children)
      ) {
        buildRoutesMap(route.children as PayloadRoute[]);
      }
    });
  };

  buildRoutesMap(routes);

  const mergeRoutesRecursive = (origRoutes: any[]): any[] => {
    return origRoutes.map(origRoute => {
      if (origRoute.id && routesMap.has(origRoute.id)) {
        const matchedRoute = routesMap.get(origRoute.id)!;

        const result = {
          loader: origRoute.hasClientLoader ? origRoute.loader : undefined,
          ...matchedRoute,
        };

        if (origRoute.children && Array.isArray(origRoute.children)) {
          (result as any).children = mergeRoutesRecursive(origRoute.children);
        }

        return result;
      }

      return origRoute;
    });
  };

  return mergeRoutesRecursive(originalRoutes);
};

const findRouteInTree = (
  routes: RouteObject[],
  routeId: string,
): RouteObject | null => {
  for (const route of routes) {
    if (route.id === routeId) {
      return route;
    }
    if (route.children && Array.isArray(route.children)) {
      const found = findRouteInTree(route.children, routeId);
      if (found) {
        return found;
      }
    }
  }
  return null;
};

export const createRouterFromPayload = (
  payload: ServerPayload,
  originalRoutes: RouteObject[],
  basename = '',
) => {
  const processedRoutes = payload.routes.reduceRight<PayloadRoute[]>(
    (previous, route) => {
      if (previous.length > 0) {
        return [
          {
            ...route,
            children: previous,
          },
        ];
      }
      return [route];
    },
    [],
  );

  const mergedRoutes = mergeRoutes(processedRoutes, originalRoutes);

  const router = createBrowserRouter(mergedRoutes, {
    //@ts-ignore
    hydrationData: payload,
    basename: basename,
    dataStrategy: async context => {
      const { request, matches } = context;
      const results: Record<string, any> = {};
      const clientMatches = matches.filter(
        match => (match.route as any).hasClientLoader,
      );

      const fetchPromise = fetch(request.url, {
        headers: {
          'x-rsc-tree': 'true',
        },
      });

      const clientLoadersPromise =
        clientMatches.length > 0
          ? Promise.all(
              clientMatches.map(async clientMatch => {
                const foundRoute = findRouteInTree(
                  originalRoutes,
                  clientMatch.route.id,
                );
                clientMatch.route.loader = foundRoute?.loader;
                const res = await clientMatch.resolve();
                return { routeId: clientMatch.route.id, result: res };
              }),
            )
          : Promise.resolve([]);

      const res = await fetchPromise;

      const redirectLocation = res.headers.get('X-Modernjs-Redirect');

      if (redirectLocation) {
        matches.forEach(match => {
          const routeId = match.route.id;
          if (routeId) {
            results[routeId] = {
              type: 'redirect',
              result: redirect(redirectLocation),
            };
          }
        });

        return results;
      }

      const [clientLoaderResults] = await Promise.all([clientLoadersPromise]);

      clientLoaderResults.forEach(({ routeId, result }) => {
        results[routeId] = result;
      });

      const payload = await createFromReadableStream(res.body);

      if (payload.type !== 'render') {
        throw new Error('Unexpected payload type');
      }

      matches.forEach(match => {
        const routeId = match.route.id;
        const matchedRoute = payload.routes.find(
          (route: PayloadRoute) => route.id === routeId,
        );
        if (matchedRoute) {
          // @ts-ignore
          router.patchRoutes(matchedRoute.parentId, [matchedRoute], true);
        }
        if (payload.loaderData?.[routeId]) {
          results[routeId] = {
            type: 'data',
            result: payload.loaderData[routeId],
          };
        }
      });

      return results;
    },
  });
  return router;
};
