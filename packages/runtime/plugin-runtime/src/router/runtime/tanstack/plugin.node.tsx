/// <reference path="./ssr-shim.d.ts" />

import { merge } from '@modern-js/runtime-utils/merge';
import {
  createRequestContext,
  type RequestContext,
} from '@modern-js/runtime-utils/node';
import type { RouteObject } from '@modern-js/runtime-utils/router';
import { time } from '@modern-js/runtime-utils/time';
import { LOADER_REPORTER_NAME } from '@modern-js/utils/universal/constants';
import {
  RouterProvider,
  createMemoryHistory,
  createRouter,
} from '@tanstack/react-router';
import { attachRouterServerSsrUtils } from '@tanstack/react-router/ssr/server';
import type React from 'react';
import { useContext } from 'react';
import type { RuntimePlugin } from '../../../core';
import {
  InternalRuntimeContext,
  getGlobalLayoutApp,
  getGlobalRoutes,
} from '../../../core/context';
import type { TInternalRuntimeContext } from '../../../core/context/runtime';
import type { RouterExtendsHooks } from '../hooks';
import type { RouterConfig } from '../types';
import { createRouteObjectsFromConfig, urlJoin } from '../utils';
import { createModernBasepathRewrite } from './basepathRewrite';
import {
  createRouteTreeFromRouteObjects,
  getModernRouteIdsFromMatches,
} from './routeTree';

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

export const tanstackRouterPlugin = (
  userConfig: Partial<RouterConfig> = {},
): RuntimePlugin<{
  extendHooks: RouterExtendsHooks;
}> => {
  return {
    name: '@modern-js/plugin-router-tanstack',
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

        // TanStack Router expects a pathname-like href for memory history entries.
        const initialHref = createGetSsrHref(request.raw);

        const requestContext = createRequestContext(
          context.ssrContext?.loaderContext,
        ) as RequestContext<Record<string, unknown>>;

        // Avoid running actions during SSR. Keep headers/cookies for loaders.
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

        const ssrScriptTag = (tanstackRouter as any).serverSsr?.takeBufferedScripts?.();
        (context as TInternalRuntimeContext).tanstackSsrScript =
          routerManagedTagToHtml(ssrScriptTag);
        (context as TInternalRuntimeContext).tanstackMatchedModernRouteIds =
          getModernRouteIdsFromMatches(tanstackRouter as any);
        (context as TInternalRuntimeContext).tanstackRouter = tanstackRouter as any;
      });

      api.wrapRoot(App => {
        const getRouteApp = () => {
          return (props => {
            const context = useContext(InternalRuntimeContext) as any as TInternalRuntimeContext;
            const router = (context as any).tanstackRouter;
            if (!router) {
              return App ? <App {...props} /> : null;
            }

            const routerWrapper = <RouterProvider router={router as any} />;

            return App ? <App>{routerWrapper}</App> : routerWrapper;
          }) as React.FC<any>;
        };

        return getRouteApp();
      });
    },
  };
};
