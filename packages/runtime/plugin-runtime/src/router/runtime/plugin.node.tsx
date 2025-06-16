import { ElementsContext } from '@modern-js/render/client';
import { merge } from '@modern-js/runtime-utils/merge';
import {
  createRequestContext,
  reporterCtx,
} from '@modern-js/runtime-utils/node';
import {
  StaticRouterProvider,
  createStaticRouter,
} from '@modern-js/runtime-utils/node/router';
import {
  AgnosticDataRouteMatch,
  // StaticRouterProvider,
  createStaticHandler,
  // createStaticRouter,
} from '@modern-js/runtime-utils/remix-router';
import {
  type DataRouteObject,
  type RouteObject,
  createRoutesFromElements,
  useActionData,
  useLoaderData,
  useMatches,
  useParams,
} from '@modern-js/runtime-utils/router';
import { time } from '@modern-js/runtime-utils/time';
import { LOADER_REPORTER_NAME } from '@modern-js/utils/universal/constants';
import React, { useContext } from 'react';
import { JSX_SHELL_STREAM_END_MARK } from '../../common';
import { RuntimeReactContext } from '../../core';
import type { RuntimePluginFuture } from '../../core';
import {
  type PayloadRoute,
  type ServerPayload,
  getGlobalEnableRsc,
  getGlobalLayoutApp,
  getGlobalRoutes,
  setGlobalContext,
  setGlobalServerPayload,
} from '../../core/context';
import DeferredDataScripts from './DeferredDataScripts.node';
import {
  type RouterExtendsHooks,
  modifyRoutes as modifyRoutesHook,
  onBeforeCreateRoutes as onBeforeCreateRoutesHook,
} from './hooks';
import type { RouterConfig } from './types';
import {
  createRouteObjectsFromConfig,
  getRouteObjects,
  renderRoutes,
  urlJoin,
} from './utils';

function cloneRoutesWithoutComponentAndElement(routes: any[]): any[] {
  return routes.map(route => {
    const {
      Component,
      element,
      children,
      lazyImport,
      loader,
      error,
      loading,
      action,
      config,
      ...rest
    } = route;
    const newRoute: any = { ...rest };
    if (children && Array.isArray(children)) {
      newRoute.children = cloneRoutesWithoutComponentAndElement(children);
    }
    return newRoute;
  });
}

function WithRouteComponentProps({
  children,
}: {
  children: React.ReactElement;
}) {
  const props = {
    loaderData: useLoaderData(),
    actionData: useActionData(),
    params: useParams(),
    matches: useMatches(),
  };
  return React.cloneElement(children, props);
}

function isLazyComponent(component: any) {
  return (
    component &&
    typeof component === 'object' &&
    component._init !== undefined &&
    component._payload !== undefined
  );
}

function createRemixReuqest(request: Request) {
  const method = 'GET';
  const { headers } = request;
  const controller = new AbortController();

  return new Request(request.url, {
    method,
    headers,
    signal: controller.signal,
  });
}

const safeUse = (promise: any) => {
  if (typeof (React as any).use === 'function') {
    return (React as any).use(promise);
  }
  return null;
};

export const routerPlugin = (
  userConfig: Partial<RouterConfig> = {},
): RuntimePluginFuture<{
  extendHooks: RouterExtendsHooks;
}> => {
  return {
    name: '@modern-js/plugin-router',
    registryHooks: {
      modifyRoutes: modifyRoutesHook,
      onBeforeCreateRoutes: onBeforeCreateRoutesHook,
    },
    setup: api => {
      let finalRouteConfig: any = {};

      api.onBeforeRender(async (context, interrupt) => {
        const pluginConfig: Record<string, any> = api.getRuntimeConfig();
        const {
          basename = '',
          routesConfig,
          createRoutes,
        } = merge(pluginConfig.router || {}, userConfig);
        finalRouteConfig = {
          routes: getGlobalRoutes(),
          globalApp: getGlobalLayoutApp(),
          ...routesConfig,
        };
        // can not get routes config, skip wrapping React Router.
        // e.g. App.tsx as the entrypoint
        if (!finalRouteConfig.routes && !createRoutes) {
          return;
        }

        const enableRsc = getGlobalEnableRsc();

        if (enableRsc) {
          const processRoutes = async (routes: any[]): Promise<void> => {
            await Promise.all(
              routes.map(async (route: any) => {
                if ('lazyImport' in route && isLazyComponent(route.component)) {
                  route.component = (await route.lazyImport()).default;
                }

                if (route.children && Array.isArray(route.children)) {
                  await processRoutes(route.children);
                }
              }),
            );
          };

          await processRoutes(finalRouteConfig.routes);
        }

        const {
          request,
          mode: ssrMode,
          nonce,
          loaderFailureMode = 'errorBoundary',
        } = context.ssrContext!;
        const { baseUrl } = request;
        const _basename =
          baseUrl === '/' ? urlJoin(baseUrl, basename) : baseUrl;
        const { reporter } = context.ssrContext!;
        const requestContext = createRequestContext(
          context.ssrContext?.loaderContext,
        );
        // TODO: we may remove it or put it to other runtime plugins in next version
        requestContext.set(reporterCtx, reporter);
        const hooks = api.getHooks();

        await hooks.onBeforeCreateRoutes.call(context);

        let routes: RouteObject[] = [];
        if (enableRsc) {
          routes = createRoutes
            ? createRoutes()
            : createRouteObjectsFromConfig({
                routesConfig: finalRouteConfig,
              });
        } else {
          routes = createRoutes
            ? createRoutes()
            : createRoutesFromElements(
                renderRoutes({
                  routesConfig: finalRouteConfig,
                  ssrMode,
                  props: {
                    nonce,
                  },
                }),
              );
        }

        routes = hooks.modifyRoutes.call(routes);

        const { query } = createStaticHandler(routes, {
          basename: _basename,
        });

        // We can't pass post request to query,due to post request would trigger react-router submit action.
        // But user maybe do not define action for page.
        const remixRequest = createRemixReuqest(
          context.ssrContext!.request.raw,
        );

        const end = time();
        const routerContext = await query(remixRequest, {
          requestContext,
        });
        const cost = end();
        context.ssrContext?.onTiming?.(LOADER_REPORTER_NAME, cost);

        if (routerContext instanceof Response) {
          // React Router would return a Response when redirects occur in loader.
          // Throw the Response to bail out and let the server handle it with an HTTP redirect
          return interrupt(routerContext);
        }

        // Now `throw new Response` or `throw new Error` is same, both will be caught by errorBoundary by default
        // If loaderFailureMode is 'clientRender', we will downgrade to csr, and the loader will be request in client again
        const errors = Object.values(
          (routerContext.errors || {}) as Record<string, Error>,
        );
        if (
          // TODO: if loaderFailureMode is not 'errroBoundary', error log will not be printed.
          errors.length > 0 &&
          loaderFailureMode === 'clientRender'
        ) {
          routerContext.statusCode = 200;
          throw errors[0];
        }
        // routerContext is used in in css colletor、handle status code、inject loader data in html
        context.routerContext = routerContext;

        let payload: ServerPayload;
        if (enableRsc) {
          payload = {
            type: 'render' as const,
            actionData: routerContext.actionData,
            errors: routerContext.errors,
            loaderData: routerContext.loaderData,
            location: routerContext.location,
            originalRoutes: cloneRoutesWithoutComponentAndElement(routes),
            routes: routerContext.matches.map((match, index, matches) => {
              const element = (match.route as any).element;
              const parentMatch = index > 0 ? matches[index - 1] : undefined;

              let processedElement;

              if (element) {
                const ElementComponent = element.type;
                if (
                  ElementComponent?.$$typeof ===
                  Symbol.for('react.client.reference')
                ) {
                  processedElement = React.createElement(
                    WithRouteComponentProps,
                    null,
                    React.createElement(ElementComponent),
                  );
                } else {
                  processedElement = React.createElement(ElementComponent, {
                    loaderData: routerContext?.loaderData?.[match.route.id],
                    actionData: routerContext?.actionData?.[match.route.id],
                    params: match.params,
                    // TODO： support matches
                  });
                }
              }

              return {
                element: processedElement,
                errorElement: (match.route as any).errorElement,
                handle: (match.route as any).handle,
                hasAction: !!(match.route as any).action,
                hasErrorBoundary: !!(match.route as any).hasErrorBoundary,
                hasLoader: !!(match.route as any).loader,
                id: match.route.id,
                index: (match.route as any).index,
                params: match.params,
                parentId:
                  parentMatch?.route.id || (match.route as any).parentId,
                path: match.route.path,
                pathname: match.pathname,
                pathnameBase: match.pathnameBase,
                shouldRevalidate: (match.route as any).shouldRevalidate,
              } as PayloadRoute;
            }),
            enableRouter: true,
          };
          setGlobalServerPayload(payload);
        }

        // private api, pass to React Component in `wrapRoot`
        Object.defineProperty(context, 'routes', {
          get() {
            return routes;
          },
          enumerable: true,
        });
      });

      api.wrapRoot(App => {
        // can not get routes config, skip wrapping React Router.
        // e.g. App.tsx as the entrypoint
        if (!finalRouteConfig) {
          return App;
        }

        const getRouteApp = () => {
          return (props => {
            const payload: ServerPayload = safeUse(safeUse(ElementsContext));
            const context = useContext(RuntimeReactContext);
            const { routerContext, ssrContext, routes } = context;
            const { nonce, mode, useJsonScript } = ssrContext!;
            const remixRouter = createStaticRouter(routes, routerContext!);
            if (!payload) {
              const routerWrapper = (
                <>
                  <StaticRouterProvider
                    router={remixRouter!}
                    context={routerContext!}
                    hydrate={false}
                  />

                  {mode === 'stream' && (
                    // ROUTER_DATA will inject in `packages/runtime/plugin-runtime/src/core/server/string/ssrData.ts` in string ssr
                    // So we can inject it only when streaming ssr
                    <DeferredDataScripts
                      nonce={nonce}
                      context={routerContext!}
                      useJsonScript={useJsonScript}
                    />
                  )}
                  {mode === 'stream' && JSX_SHELL_STREAM_END_MARK}
                </>
              );
              return App ? <App>{routerWrapper}</App> : routerWrapper;
            } else {
              if (payload.type !== 'render') return null;
              const routerContext = {
                actionData: payload.actionData,
                actionHeaders: {},
                // TODO：支持多 entry
                basename: '/',
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

              const processedRoutes = payload.routes.reduceRight<
                PayloadRoute[]
              >((previous, route) => {
                if (previous.length > 0) {
                  return [
                    {
                      ...route,
                      children: previous,
                    },
                  ];
                }
                return [route];
              }, []);

              const router = createStaticRouter(
                processedRoutes,
                routerContext!,
              );

              const staticRouter = (
                <>
                  <StaticRouterProvider
                    context={routerContext!}
                    router={router}
                    hydrate={false}
                  >
                    <DeferredDataScripts
                      context={routerContext!}
                      useJsonScript={useJsonScript}
                    />
                  </StaticRouterProvider>
                  {/* {JSX_SHELL_STREAM_END_MARK} */}
                </>
              );

              return App ? <App>{staticRouter}</App> : staticRouter;
            }
          }) as React.FC<any>;
        };

        return getRouteApp();
      });
    },
  };
};

export const modifyRoutes = () => {
  // empty
};
