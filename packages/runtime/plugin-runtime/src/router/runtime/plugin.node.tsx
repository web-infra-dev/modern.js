import React, { useContext } from 'react';
import { unstable_createStaticHandler as createStaticHandler } from '@remix-run/router';
import {
  unstable_createStaticRouter as createStaticRouter,
  unstable_StaticRouterProvider as StaticRouterProvider,
} from 'react-router-dom/server';
import hoistNonReactStatics from 'hoist-non-react-statics';
import { installGlobals } from '@remix-run/node';
import { createRoutesFromElements } from 'react-router-dom';
import { RuntimeReactContext } from '../../core';
import type { Plugin } from '../../core';
import { SSRServerContext } from '../../ssr/serverRender/types';
import type { RouterConfig } from './types';
import { renderRoutes } from './utils';
import { createConfigRoutes } from './ConfigRoutes';

// Polyfill Web Fetch API
installGlobals();

// TODO: polish
function createFetchRequest(req: SSRServerContext['request']): Request {
  // const origin = `${req.protocol}://${req.get('host')}`;
  const origin = `${req.protocol}://${req.host}`;
  // Note: This had to take originalUrl into account for presumably vite's proxying
  const url = new URL(req.originalUrl || req.url, origin);

  const controller = new AbortController();

  // req.on('close', () => {
  //   controller.abort();
  // });

  const init = {
    method: req.method,
    headers: createFetchHeaders(req.headers),
    signal: controller.signal,
  };

  // if (req.method !== 'GET' && req.method !== 'HEAD') {
  //   init.body = req.body;
  // }

  return new Request(url.href, init);
}

export function createFetchHeaders(
  requestHeaders: SSRServerContext['request']['headers'],
): Headers {
  const headers = new Headers();

  for (const [key, values] of Object.entries(requestHeaders)) {
    if (values) {
      if (Array.isArray(values)) {
        for (const value of values) {
          headers.append(key, value);
        }
      } else {
        headers.set(key, values);
      }
    }
  }

  return headers;
}

export const routerPlugin = ({
  routesConfig,
  configRoutes,
}: RouterConfig): Plugin => {
  return {
    name: '@modern-js/plugin-router',
    setup: () => {
      return {
        async init({ context }, next) {
          const { request }: { request: SSRServerContext['request'] } =
            context.ssrContext!;

          const routeElements = renderRoutes(routesConfig);
          const routes = configRoutes
            ? createConfigRoutes(configRoutes)
            : createRoutesFromElements(routeElements);

          const { query } = createStaticHandler(routes);
          const remixRequest = createFetchRequest(request);
          const routerContext = await query(remixRequest);

          if (routerContext instanceof Response) {
            // TODO: resolve repsonse ?
            return next({ context });
          }

          const router = createStaticRouter(routes, routerContext);
          context.router = router;
          context.routerContext = routerContext;
          return next({ context });
        },
        hoc: ({ App }, next) => {
          const getRouteApp = () => {
            return (props => {
              const { router, routerContext } = useContext(RuntimeReactContext);
              return (
                <App {...props}>
                  <StaticRouterProvider
                    router={router}
                    context={routerContext}
                    nonce="the-nonce"
                  />
                </App>
              );
            }) as React.FC<any>;
          };

          const RouteApp = getRouteApp();

          if (routesConfig?.globalApp) {
            return next({
              App: hoistNonReactStatics(RouteApp, routesConfig.globalApp),
            });
          }

          return next({
            App: RouteApp,
          });
        },
      };
    },
  };
};
