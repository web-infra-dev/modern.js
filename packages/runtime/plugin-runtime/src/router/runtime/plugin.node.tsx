import React, { useContext } from 'react';
import serialize from 'serialize-javascript';
import {
  createStaticHandler,
  StaticHandlerContext,
  isRouteErrorResponse,
} from '@remix-run/router';
import {
  createStaticRouter,
  StaticRouterProvider,
} from 'react-router-dom/server';
import hoistNonReactStatics from 'hoist-non-react-statics';
import { createRoutesFromElements } from 'react-router-dom';
import { RuntimeReactContext } from '../../core';
import type { Plugin } from '../../core';
import { SSRServerContext } from '../../ssr/serverRender/types';
import type { RouterConfig } from './types';
import { renderRoutes, urlJoin } from './utils';
import './fetch';

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

  for (const [key, values] of Object.entries(requestHeaders || {})) {
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
/**
 * This function is copy from source found in https://github.com/remix-run/react-router
 *
 * MIT Licensed
 * Copyright (c) React Training 2015-2019 Copyright (c) Remix Software 2020-2022
 * https://github.com/remix-run/react-router/blob/main/LICENSE.md
 */
function serializeErrors(
  errors: StaticHandlerContext['errors'],
): StaticHandlerContext['errors'] {
  if (!errors) {
    return null;
  }
  const entries = Object.entries(errors);
  const serialized: StaticHandlerContext['errors'] = {};
  for (const [key, val] of entries) {
    // Hey you!  If you change this, please change the corresponding logic in
    // deserializeErrors in react-router-dom/index.tsx :)
    if (isRouteErrorResponse(val)) {
      serialized[key] = { ...val, __type: 'RouteErrorResponse' };
    } else if (val instanceof Error) {
      // Do not serialize stack traces from SSR for security reasons
      serialized[key] = {
        message: val.message,
        __type: 'Error',
      };
    } else {
      serialized[key] = val;
    }
  }
  return serialized;
}

export const routerPlugin = ({
  basename = '',
  routesConfig,
  createRoutes,
}: RouterConfig): Plugin => {
  return {
    name: '@modern-js/plugin-router',
    setup: () => {
      return {
        async init({ context }, next) {
          // can not get routes config, skip wrapping React Router.
          // e.g. App.tsx as the entrypoint
          if (!routesConfig && !createRoutes) {
            return next({ context });
          }

          const { request }: { request: SSRServerContext['request'] } =
            context.ssrContext!;
          const baseUrl = request.baseUrl as string;
          const _basename =
            baseUrl === '/' ? urlJoin(baseUrl, basename) : baseUrl;

          const routes = createRoutes
            ? createRoutes()
            : createRoutesFromElements(renderRoutes(routesConfig));

          const { query } = createStaticHandler(routes, {
            basename: _basename,
          });
          const remixRequest = createFetchRequest(request);
          const routerContext = await query(remixRequest);

          if (routerContext instanceof Response) {
            // React Router would return a Response when redirects occur in loader.
            // Throw the Response to bail out and let the server handle it with an HTTP redirect
            return routerContext;
          }

          const router = createStaticRouter(routes, routerContext);
          context.router = router;
          context.routerContext = routerContext;
          context.routes = routes;
          // set routeManifest in context to be consistent with csr context
          context.routeManifest = context.ssrContext!.routeManifest;
          return next({ context });
        },
        hoc: ({ App }, next) => {
          // can not get routes config, skip wrapping React Router.
          // e.g. App.tsx as the entrypoint
          if (!routesConfig) {
            return next({ App });
          }

          const getRouteApp = () => {
            return (props => {
              const { router, routerContext } = useContext(RuntimeReactContext);
              const data = {
                loaderData: routerContext.loaderData,
                actionData: routerContext.actionData,
                errors: serializeErrors(routerContext.errors),
              };
              const hydrateScript = `window.__staticRouterHydrationData = ${serialize(
                data,
                { isJSON: true },
              )};`;
              return (
                <App {...props}>
                  <StaticRouterProvider
                    router={router}
                    context={routerContext}
                    hydrate={false}
                  />
                  <script
                    suppressHydrationWarning
                    id="the-nonce"
                    // eslint-disable-next-line react/no-danger
                    dangerouslySetInnerHTML={{ __html: hydrateScript }}
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

export const modifyRoutes = () => {
  // empty
};
