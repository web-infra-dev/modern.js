import { createFromReadableStream } from '@modern-js/render/client';
import { createBrowserRouter } from '@modern-js/runtime-utils/router';
import { use } from 'react';
import type { PayloadRoute, ServerPayload } from '../../core/context';

export function RscClientRouter({
  rscPayload,
}: {
  rscPayload: any;
}) {
  const payload = use(rscPayload);
  try {
    const router = createRouterFromPayload(payload);

    return {
      router,
      routes: router.routes || [],
    };
  } catch (e) {
    console.error('Failed to create router from RSC payload:', e);
  }
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

        const result = { ...matchedRoute };

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

export const createRouterFromPayload = (payload: ServerPayload) => {
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

  const mergedRoutes = mergeRoutes(processedRoutes, payload.originalRoutes);

  const router = createBrowserRouter(mergedRoutes, {
    dataStrategy: async context => {
      const { request, matches } = context;
      const results: Record<string, any> = {};
      const res = await fetch(request.url, {
        headers: {
          'x-rsc-tree': 'true',
        },
      });

      const payload = await createFromReadableStream(res.body);

      if (payload === 'redirect') {
      }

      if (payload.type !== 'render') {
        throw new Error('Unexpected payload type');
      }

      matches.forEach(match => {
        const routeId = match.route.id;
        const matchedRoute = payload.routes.find(route => route.id === routeId);
        //@ts-ignore
        router.patchRoutes(matchedRoute.parentId, [matchedRoute], true);
      });

      return results;
    },
  });
  return router;
};
