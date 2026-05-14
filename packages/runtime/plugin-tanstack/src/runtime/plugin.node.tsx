/// <reference path="./ssr-shim.d.ts" />

import {
  getGlobalLayoutApp,
  getGlobalRoutes,
  InternalRuntimeContext,
  type TInternalRuntimeContext,
} from '@modern-js/runtime/context';
import type { RuntimePlugin } from '@modern-js/runtime/plugin';
import { merge } from '@modern-js/runtime-utils/merge';
import {
  createRequestContext,
  type RequestContext,
} from '@modern-js/runtime-utils/node';
import type { RouteObject } from '@modern-js/runtime-utils/router';
import { time } from '@modern-js/runtime-utils/time';
import { LOADER_REPORTER_NAME } from '@modern-js/utils/universal/constants';
import {
  type AnyRouter,
  createMemoryHistory,
  createRouter,
  RouterProvider,
} from '@tanstack/react-router';
import { attachRouterServerSsrUtils } from '@tanstack/react-router/ssr/server';
import type React from 'react';
import { Suspense, useContext } from 'react';
import { createModernBasepathRewrite } from './basepathRewrite';
import {
  modifyRoutes as modifyRoutesHook,
  onAfterCreateRouter as onAfterCreateRouterHook,
  onAfterHydrateRouter as onAfterHydrateRouterHook,
  onBeforeCreateRouter as onBeforeCreateRouterHook,
  onBeforeCreateRoutes as onBeforeCreateRoutesHook,
  onBeforeHydrateRouter as onBeforeHydrateRouterHook,
  type RouterExtendsHooks,
} from './hooks';
import {
  applyRouterServerPrepareResult,
  createRouterServerSnapshot,
  type RouterLifecycleContext,
} from './lifecycle';
import {
  createRouteTreeFromRouteObjects,
  getModernRouteIdsFromMatches,
} from './routeTree';
import type { InternalRouterServerSnapshot, RouterConfig } from './types';
import { createRouteObjectsFromConfig, urlJoin } from './utils';

type ModernTanstackRouterContext = {
  request: Request;
  requestContext: RequestContext<Record<string, unknown>>;
};

function htmlEscapeAttr(value: string) {
  return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;');
}

function routerManagedTagToHtml(tag: any): string {
  if (!tag || tag.tag !== 'script') {
    return '';
  }

  const attrs: Record<string, unknown> = tag.attrs || {};
  const attrsStr = Object.entries(attrs)
    .filter(([, v]) => v != null && v !== false)
    .map(([k, v]) => {
      const name = k === 'className' ? 'class' : k;
      if (v === true) {
        return name;
      }
      return `${name}="${htmlEscapeAttr(String(v))}"`;
    })
    .join(' ');

  const open = attrsStr.length ? `<script ${attrsStr}>` : '<script>';
  const children = typeof tag.children === 'string' ? tag.children : '';
  return `${open}${children}</script>`;
}

function routerManagedTagsToHtml(tags: any): string[] {
  const normalizedTags = Array.isArray(tags) ? tags : [tags];
  return normalizedTags.map(routerManagedTagToHtml).filter(Boolean);
}

function createGetSsrHref(request: Request): string {
  const url = new URL(request.url);
  return `${url.pathname}${url.search}${url.hash}`;
}

function stripSyntheticNotFoundRoute(routes: RouteObject[]): RouteObject[] {
  return routes
    .filter(route => !(route.path === '*' && !route.id && !route.loader))
    .map(route => {
      if (!route.children?.length) {
        return route;
      }
      return {
        ...route,
        children: stripSyntheticNotFoundRoute(route.children),
      };
    });
}

function collectRouterErrors(
  tanstackRouter: AnyRouter,
): Record<string, unknown> | undefined {
  const matches = Array.isArray((tanstackRouter as any).state?.matches)
    ? (tanstackRouter as any).state.matches
    : [];
  const errors = matches.reduce((acc: Record<string, unknown>, match: any) => {
    if (!match?.error) {
      return acc;
    }

    const routeId =
      typeof match.routeId === 'string'
        ? match.routeId
        : typeof match.route?.id === 'string'
          ? match.route.id
          : `match-${Object.keys(acc).length}`;

    acc[routeId] = match.error;
    return acc;
  }, {});

  return Object.keys(errors).length > 0 ? errors : undefined;
}

export const tanstackRouterPlugin = (
  userConfig: Partial<RouterConfig> = {},
): RuntimePlugin<{
  extendHooks: RouterExtendsHooks;
}> => {
  return {
    name: '@modern-js/plugin-router-tanstack',
    registryHooks: {
      modifyRoutes: modifyRoutesHook,
      onAfterCreateRouter: onAfterCreateRouterHook,
      onAfterHydrateRouter: onAfterHydrateRouterHook,
      onBeforeCreateRouter: onBeforeCreateRouterHook,
      onBeforeCreateRoutes: onBeforeCreateRoutesHook,
      onBeforeHydrateRouter: onBeforeHydrateRouterHook,
    },
    setup: api => {
      api.onBeforeRender(async (context, interrupt) => {
        const pluginConfig: Record<string, any> = api.getRuntimeConfig();
        const mergedConfig = merge(
          pluginConfig.router || {},
          userConfig,
        ) as RouterConfig;

        const { basename = '', routesConfig, createRoutes } = mergedConfig;

        const finalRouteConfig = {
          routes: getGlobalRoutes(),
          globalApp: getGlobalLayoutApp(),
          ...routesConfig,
        };

        if (!finalRouteConfig.routes && !createRoutes) {
          return;
        }

        const hooks = api.getHooks();
        await hooks.onBeforeCreateRoutes.call(context);

        const routeObjects = createRoutes
          ? createRoutes()
          : createRouteObjectsFromConfig({
              routesConfig: finalRouteConfig,
              ssrMode: context.ssrContext?.mode,
            }) || [];
        const normalizedRouteObjects = createRoutes
          ? routeObjects
          : stripSyntheticNotFoundRoute(routeObjects);
        const modifiedRouteObjects = hooks.modifyRoutes.call(
          normalizedRouteObjects,
        );

        if (!modifiedRouteObjects.length) {
          return;
        }

        const { request, nonce, baseUrl } = context.ssrContext!;

        const _basename =
          baseUrl === '/' ? urlJoin(baseUrl, basename || '') : baseUrl;

        const initialHref = createGetSsrHref(request.raw);

        const requestContext = createRequestContext(
          context.ssrContext?.loaderContext,
        ) as RequestContext<Record<string, unknown>>;

        const controller = new AbortController();
        const ssrRequest = new Request(request.raw.url, {
          method: 'GET',
          headers: request.raw.headers,
          signal: controller.signal,
        });

        const routerContext: ModernTanstackRouterContext = {
          request: ssrRequest,
          requestContext,
        };

        const routeTree = createRouteTreeFromRouteObjects(modifiedRouteObjects);
        const history = createMemoryHistory({
          initialEntries: [initialHref],
        });

        const rewrite = createModernBasepathRewrite(_basename);
        const routerLifecycleContext: RouterLifecycleContext = {
          framework: 'tanstack',
          phase: 'ssr-prepare',
          routes: modifiedRouteObjects,
          runtimeContext: context as TInternalRuntimeContext,
          basename: _basename,
        };
        hooks.onBeforeCreateRouter.call(routerLifecycleContext);

        const tanstackRouter = createRouter({
          routeTree,
          history,
          basepath: '/',
          rewrite,
          origin: new URL(request.raw.url).origin,
          ssr: { nonce },
          context: routerContext as any,
        });

        attachRouterServerSsrUtils({
          router: tanstackRouter as any,
          manifest: undefined,
        });

        const end = time();

        try {
          await tanstackRouter.load();
        } finally {
          const cost = end();
          context.ssrContext?.onTiming?.(LOADER_REPORTER_NAME, cost);
        }

        if ((tanstackRouter as any).state?.redirect) {
          const resolved = (tanstackRouter as any).resolveRedirect
            ? (tanstackRouter as any).resolveRedirect(
                (tanstackRouter as any).state.redirect,
              )
            : (tanstackRouter as any).state.redirect;

          try {
            (tanstackRouter as any).serverSsr?.cleanup?.();
          } catch {}

          return interrupt(resolved as any);
        }

        context.ssrContext?.response.status(tanstackRouter.state.statusCode);

        await (tanstackRouter as any).serverSsr?.dehydrate?.();

        const ssrScriptTags = (
          tanstackRouter as any
        ).serverSsr?.takeBufferedScripts?.();
        const hydrationScripts = routerManagedTagsToHtml(ssrScriptTags);
        const matchedRouteIds = getModernRouteIdsFromMatches(
          tanstackRouter as any,
        );
        const routerServerSnapshot: InternalRouterServerSnapshot =
          createRouterServerSnapshot({
            framework: 'tanstack',
            basename: _basename,
            statusCode: tanstackRouter.state.statusCode,
            errors: collectRouterErrors(tanstackRouter as any),
            matchedRouteIds,
            hydrationScripts,
          });
        const runtimeContext = applyRouterServerPrepareResult(
          context as TInternalRuntimeContext,
          {
            snapshot: routerServerSnapshot,
            cleanup: () => (tanstackRouter as any).serverSsr?.cleanup?.(),
            state: {
              framework: 'tanstack',
              basename: _basename,
              instance: tanstackRouter as any,
              hydrationScripts,
              matchedRouteIds,
              serverSnapshot: routerServerSnapshot,
            },
          },
        );
        hooks.onAfterCreateRouter.call({
          ...routerLifecycleContext,
          router: tanstackRouter as any,
          serverSnapshot: routerServerSnapshot,
          runtimeContext,
        });
      });

      api.wrapRoot(App => {
        const getRouteApp = () => {
          return (props => {
            const context = useContext(
              InternalRuntimeContext,
            ) as any as TInternalRuntimeContext;
            const router =
              context.routerInstance ?? context.routerRuntime?.instance;
            if (!router) {
              return App ? <App {...props} /> : null;
            }

            const routerWrapper = (
              <Suspense fallback={null}>
                <RouterProvider router={router as any} />
              </Suspense>
            );

            return App ? <App>{routerWrapper}</App> : routerWrapper;
          }) as React.FC<any>;
        };

        return getRouteApp();
      });
    },
  };
};

export default tanstackRouterPlugin;
