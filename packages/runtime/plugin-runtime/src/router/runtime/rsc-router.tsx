import {
  ElementsContext,
  createFromReadableStream,
} from '@modern-js/render/client';
import {
  type StaticHandlerContext,
  StaticRouterProvider,
  createStaticRouter,
} from '@modern-js/runtime-utils/router';
import {
  type RouteObject,
  createBrowserRouter,
  redirect,
} from '@modern-js/runtime-utils/router';
import React from 'react';
import type { PayloadRoute, ServerPayload } from '../../core/context';
import { CSSLinks } from './CSSLinks';

// There is no `use` method in the following version of react19.
// In order to avoid errors, it is compatible here.
const safeUse = (promise: any) => {
  if (typeof (React as any).use === 'function') {
    return (React as any).use(promise);
  }
  return null;
};

/**
 * Collect CSS files from matched routes
 */
function collectCssFilesFromRoutes(
  matches: StaticHandlerContext['matches'],
  routes: RouteObject[],
): string[] {
  const cssFiles: string[] = [];

  for (const match of matches) {
    // Use findRouteInTree to recursively find nested routes
    const route = findRouteInTree(routes, match.route.id);
    if (!route) continue;

    // Try to get entryCssFiles from Component property
    const component = (route as any).Component;
    if (
      component &&
      typeof component === 'function' &&
      'entryCssFiles' in component
    ) {
      const css = (component as any).entryCssFiles;
      if (Array.isArray(css)) {
        cssFiles.push(...css);
      }
    }
  }

  // Remove duplicates and return
  return Array.from(new Set(cssFiles));
}

export const createServerPayload = (
  routerContext: StaticHandlerContext,
  routes: RouteObject[],
): ServerPayload => {
  const cssFiles = collectCssFilesFromRoutes(routerContext.matches, routes);

  return {
    type: 'render' as const,
    actionData: routerContext.actionData,
    errors: routerContext.errors,
    loaderData: routerContext.loaderData,
    location: routerContext.location,
    routes: routerContext.matches.map((match, index: number, matches) => {
      const element = (match.route as any).element;
      const parentMatch = index > 0 ? matches[index - 1] : undefined;

      let processedElement;

      if (element) {
        const ElementComponent = element.type;
        const elementProps = {
          loaderData: routerContext?.loaderData?.[(match.route as any).id],
          actionData: routerContext?.actionData?.[(match.route as any).id],
          params: match.params,
          matches: routerContext.matches.map((m: any) => {
            const { route, pathname, params } = m;
            return {
              id: route.id,
              pathname,
              params,
              data: routerContext?.loaderData?.[route.id],
              handle: route.handle,
            };
          }),
        };

        const routeElement = React.createElement(
          ElementComponent,
          elementProps,
        );

        // Inject CSS Links for the leaf route (last matched route)
        // This ensures CSS is included in the RSC payload
        const isLeafRoute = index === routerContext.matches.length - 1;
        if (isLeafRoute && cssFiles.length > 0) {
          // Wrap CSS Links and route element together
          // React will automatically hoist the link tags to head
          processedElement = React.createElement(
            React.Fragment,
            null,
            React.createElement(CSSLinks, { cssFiles }),
            routeElement,
          );
        } else {
          processedElement = routeElement;
        }
      }

      return {
        element: processedElement,
        errorElement: (match.route as any).errorElement,
        handle: (match.route as any).handle,
        hasAction: !!(match.route as any).action,
        hasErrorBoundary: !!(match.route as any).hasErrorBoundary,
        hasLoader: !!(match.route as any).loader,
        hasClientLoader: !!(match.route as any).hasClientLoader,
        id: match.route.id,
        index: (match.route as any).index,
        params: match.params,
        parentId: parentMatch?.route.id || (match.route as any).parentId,
        path: match.route.path,
        pathname: match.pathname,
        pathnameBase: match.pathnameBase,
      } as PayloadRoute;
    }),
  };
};

export const handleRSCRedirect = (
  headers: Headers,
  basename: string,
  status: number,
): Response => {
  const newHeaders = new Headers(headers);
  let redirectUrl = headers.get('Location')!;

  if (basename !== '/') {
    redirectUrl = redirectUrl.replace(basename, '');
  }

  newHeaders.set('X-Modernjs-Redirect', redirectUrl);
  newHeaders.set('X-Modernjs-BaseUrl', basename);
  newHeaders.delete('Location');

  return new Response(null, {
    status: status,
    headers: newHeaders,
  });
};

export const prepareRSCRoutes = async (
  routes: RouteObject[],
): Promise<void> => {
  const isLazyComponent = (component: any) => {
    return (
      component &&
      typeof component === 'object' &&
      component._init !== undefined &&
      component._payload !== undefined
    );
  };

  const processRoutes = async (routesList: RouteObject[]): Promise<void> => {
    await Promise.all(
      routesList.map(async (route: any) => {
        if ('lazyImport' in route && isLazyComponent(route.component)) {
          route.component = (await route.lazyImport()).default;
        }

        if (route.children && Array.isArray(route.children)) {
          await processRoutes(route.children);
        }
      }),
    );
  };

  await processRoutes(routes);
};

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

      if (!res.body) {
        throw new Error('Response body is null');
      }

      const payload = await createFromReadableStream(res.body);

      if (
        typeof payload !== 'object' ||
        payload === null ||
        typeof (payload as any).type === 'undefined' ||
        (payload as any).type !== 'render'
      ) {
        throw new Error('Unexpected payload type');
      }

      const serverPayload = payload as ServerPayload;

      matches.forEach(match => {
        const routeId = match.route.id;
        const matchedRoute = serverPayload.routes.find(
          (route: PayloadRoute) => route.id === routeId,
        );
        if (matchedRoute) {
          // @ts-ignore
          router.patchRoutes(matchedRoute.parentId, [matchedRoute], true);
        }
        if (serverPayload.loaderData?.[routeId]) {
          results[routeId] = {
            type: 'data',
            result: serverPayload.loaderData[routeId],
          };
        }
      });

      return results;
    },
  });
  return router;
};

interface RSCStaticRouterProps {
  basename?: string;
  useJsonScript?: boolean;
}

const createRSCStaticRouterComponent = (
  payload: ServerPayload,
  basename?: string,
) => {
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
    <StaticRouterProvider
      context={routerContext}
      router={router}
      hydrate={false}
    />
  );
};

export const RSCStaticRouter: React.FC<RSCStaticRouterProps> = ({
  basename,
}) => {
  const payload: ServerPayload = safeUse(safeUse(ElementsContext));

  if (!payload || payload.type !== 'render') {
    return null;
  }

  return <>{createRSCStaticRouterComponent(payload, basename)}</>;
};
