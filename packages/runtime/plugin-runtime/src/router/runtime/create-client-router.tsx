import {
  type RouteObject,
  createBrowserRouter,
  redirect,
} from '@modern-js/runtime-utils/router';
import type { PayloadRoute, ServerPayload } from '../../core/context';

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

export const createClientRouterFromPayload = (
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

      const { createFromReadableStream } = await import(
        '@modern-js/render/client'
      );

      const payload = await createFromReadableStream(res.body);

      if (typeof payload.type === 'undefined' || payload.type !== 'render') {
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
