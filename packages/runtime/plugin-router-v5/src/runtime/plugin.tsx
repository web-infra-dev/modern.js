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
import hoistNonReactStatics from 'hoist-non-react-statics';
import { RuntimeReactContext, isBrowser } from '@modern-js/runtime';
import type { Plugin } from '@modern-js/runtime';
import { parsedJSONFromElement } from '@modern-js/runtime-utils/parsed';
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

export const routerPlugin = ({
  serverBase = [],
  history: customHistory,
  supportHtml5History = true,
  routesConfig,
  createRoutes,
  historyOptions = {},
}: RouterConfig): Plugin => {
  const originRoutes = routesConfig?.routes || [];
  const isBrow = isBrowser();

  const select = (pathname: string) =>
    serverBase.find(baseUrl => pathname.search(baseUrl) === 0) || '/';

  let routes: SingleRouteConfig[] = [];

  if (isBrow) {
    window._SERVER_DATA = parsedJSONFromElement('__MODERN_SERVER_DATA__');
  }

  return {
    name: '@modern-js/plugin-router',
    registerHook: {
      modifyRoutes: modifyRoutesHook,
    },
    setup: api => {
      return {
        init({ context }, next) {
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

          return next({ context });
        },
        hoc: ({ App, config }, next) => {
          const getRouteApp = () => {
            if (isBrow) {
              const baseUrl =
                window._SERVER_DATA?.router.baseUrl ||
                select(location.pathname);
              historyOptions.basename =
                baseUrl === '/'
                  ? urlJoin(baseUrl, historyOptions.basename as string)
                  : baseUrl;

              const history =
                customHistory ||
                (supportHtml5History
                  ? createBrowserHistory(historyOptions)
                  : createHashHistory(historyOptions));
              return (props: any) => {
                const runner = (api as any).useHookRunners();
                routes = runner.modifyRoutes(originRoutes);
                routesConfig && (routesConfig.routes = routes);
                return (
                  <Router history={history}>
                    {createRoutes ? (
                      <App {...props} Component={createRoutes()} />
                    ) : (
                      <App {...props}>{renderRoutes(routesConfig, props)}</App>
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
              const baseUrl = request?.baseUrl as string;
              const basename =
                baseUrl === '/'
                  ? urlJoin(baseUrl, historyOptions.basename as string)
                  : baseUrl;
              const runner = (api as any).useHookRunners();
              const routes = runner.modifyRoutes(originRoutes);
              routesConfig && (routesConfig.routes = routes);
              return (
                <StaticRouter
                  basename={basename === '/' ? '' : basename}
                  location={location}
                  context={routerContext}
                >
                  {createRoutes ? (
                    <App {...props} Component={createRoutes()} />
                  ) : (
                    <App {...props}>{renderRoutes(routesConfig, props)}</App>
                  )}
                </StaticRouter>
              );
            };
          };

          let RouteApp = getRouteApp();
          if (App) {
            RouteApp = hoistNonReactStatics(RouteApp, App);
          }
          if (routesConfig?.globalApp) {
            return next({
              App: hoistNonReactStatics(RouteApp, routesConfig.globalApp),
              config,
            });
          }
          return next({
            App: RouteApp,
            config,
          });
        },
      };
    },
  };
};
