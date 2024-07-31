/* eslint-disable no-nested-ternary */
import React, { useContext } from 'react';
import {
  createBrowserHistory,
  createHashHistory,
  History,
  BrowserHistoryBuildOptions,
  HashHistoryBuildOptions,
} from 'history';
import {
  Router,
  StaticRouter,
  RouteProps,
  useRouteMatch,
  useLocation,
  useHistory,
} from 'react-router-dom';
import { RuntimeReactContext, isBrowser } from '@meta/runtime';
import type { Plugin } from '@modern-js/runtime';
import { parsedJSONFromElement } from '@modern-js/runtime-utils/parsed';
import { getGlobalLayoutApp, getGlobalRoutes } from '@meta/runtime/context';
import { merge } from '@modern-js/runtime-utils/merge';
import { renderRoutes, getLocation, urlJoin } from './utils';
import { modifyRoutesHook } from './hooks';

declare global {
  interface Window {
    _SERVER_DATA?: {
      router: {
        baseUrl: string;
        params: Record<string, string>;
      };
    };
  }
}

export type SingleRouteConfig = RouteProps & {
  redirect?: string;
  routes?: SingleRouteConfig[];
  key?: string;

  /**
   * layout component
   */
  layout?: React.ComponentType;

  /**
   * component would be rendered when route macthed.
   */
  component?: React.ComponentType;
};

export type HistoryConfig =
  | {
      supportHtml5History: true;
      historyOptions: BrowserHistoryBuildOptions;
    }
  | {
      supportHtml5History: false;
      historyOptions: HashHistoryBuildOptions;
    };

export type RouterConfig = Partial<HistoryConfig> & {
  mode?: 'react-router-5';
  routesConfig?: {
    globalApp?: React.ComponentType<any>;
    routes?: SingleRouteConfig[];
  };
  createRoutes?: () => React.ComponentType<any> | null;
  history?: History;
  serverBase?: string[];
};

let routes: SingleRouteConfig[] = [];

export const routerPlugin = (userConfig: RouterConfig = {}): Plugin => {
  return {
    name: '@modern-js/plugin-router',
    registerHook: {
      modifyRoutes: modifyRoutesHook,
    },
    setup: api => {
      return {
        beforeRender(context) {
          context.router = {
            useRouteMatch,
            useLocation,
            useHistory,
          };

          Object.defineProperty(context, 'routes', {
            get() {
              return routes;
            },
          });
        },
        wrapRoot: App => {
          const pluginConfig: Record<string, any> =
            api.useRuntimeConfigContext();
          const {
            serverBase = [],
            history: customHistory,
            supportHtml5History = true,
            routesConfig,
            createRoutes,
            historyOptions = {},
          } = merge(pluginConfig.router || {}, userConfig) as RouterConfig;
          const finalRouteConfig = {
            routes: getGlobalRoutes() as SingleRouteConfig[],
            globalApp: getGlobalLayoutApp(),
            ...routesConfig,
          };
          const originRoutes = finalRouteConfig?.routes;
          const isBrow = isBrowser();

          const select = (pathname: string) =>
            serverBase.find(baseUrl => pathname.search(baseUrl) === 0) || '/';
          if (isBrow) {
            window._SERVER_DATA = parsedJSONFromElement(
              '__MODERN_SERVER_DATA__',
            );
          }
          const getRouteApp = () => {
            if (isBrow) {
              return (props: any) => {
                const runtimeContext = useContext(RuntimeReactContext);
                const baseUrl = (
                  runtimeContext._internalRouterBaseName ||
                  window._SERVER_DATA?.router.baseUrl ||
                  select(location.pathname)
                ).replace(/^\/*/, '/');
                const basename =
                  baseUrl === '/'
                    ? urlJoin(baseUrl, historyOptions.basename as string)
                    : baseUrl;
                historyOptions.basename = basename;
                const history =
                  customHistory ||
                  (supportHtml5History
                    ? createBrowserHistory(historyOptions)
                    : createHashHistory(historyOptions));
                const runner = (api as any).useHookRunners();
                routes = runner.modifyRoutes(originRoutes);
                finalRouteConfig && (finalRouteConfig.routes = routes);
                /**
                 * when exist createRoutes function, App.tsx must be exist, and support Component props
                 * this is compatible config routes
                 */
                return (
                  <Router history={history}>
                    {createRoutes ? (
                      <App Component={createRoutes()} />
                    ) : App && !finalRouteConfig?.routes ? (
                      <App {...props} />
                    ) : (
                      renderRoutes(finalRouteConfig, props)
                    )}
                  </Router>
                );
              };
            }
            return (props: any) => {
              const runtimeContext = useContext(RuntimeReactContext);
              const { ssrContext } = runtimeContext;
              const location = getLocation(ssrContext);
              const routerContext = ssrContext?.redirection || {};
              const request = ssrContext?.request;
              const baseUrl = (
                runtimeContext._internalRouterBaseName ||
                (request?.baseUrl as string)
              )?.replace(/^\/*/, '/');

              const basename =
                baseUrl === '/'
                  ? urlJoin(baseUrl, historyOptions.basename as string)
                  : baseUrl;
              const runner = (api as any).useHookRunners();
              const routes = runner.modifyRoutes(originRoutes);
              finalRouteConfig && (finalRouteConfig.routes = routes);
              return (
                <StaticRouter
                  basename={basename === '/' ? '' : basename}
                  location={location}
                  context={routerContext}
                >
                  {createRoutes ? (
                    <App Component={createRoutes()} />
                  ) : App && !finalRouteConfig?.routes ? (
                    <App {...props} />
                  ) : (
                    renderRoutes(finalRouteConfig, props)
                  )}
                </StaticRouter>
              );
            };
          };

          return getRouteApp();
        },
      };
    },
  };
};
