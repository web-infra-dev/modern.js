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
import { RuntimeReactContext, isBrowser } from '@modern-js/runtime';
import type { Plugin } from '@modern-js/runtime';
import { parsedJSONFromElement } from '@modern-js/runtime-utils/parsed';
import {
  getGlobalLayoutApp,
  getGlobalRoutes,
} from '@modern-js/runtime/context';
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
// eslint-disable-next-line import/no-mutable-exports
export let finalRouteConfig: RouterConfig['routesConfig'] = {
  routes: [],
};

export const routerPlugin = ({
  serverBase = [],
  history: customHistory,
  supportHtml5History = true,
  routesConfig,
  createRoutes,
  historyOptions = {},
}: RouterConfig): Plugin => {
  finalRouteConfig = {
    routes: getGlobalRoutes() as SingleRouteConfig[],
    globalApp: getGlobalLayoutApp(),
    ...routesConfig,
  };
  const originRoutes = finalRouteConfig?.routes;
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
              const basename =
                baseUrl === '/'
                  ? urlJoin(
                      baseUrl,
                      config.router?.basename?.replace(/^\/*/, '/') ||
                        (historyOptions.basename as string),
                    )
                  : baseUrl;
              historyOptions.basename = basename;
              const history =
                customHistory ||
                (supportHtml5History
                  ? createBrowserHistory(historyOptions)
                  : createHashHistory(historyOptions));
              return (props: any) => {
                const runner = (api as any).useHookRunners();
                routes = runner.modifyRoutes(originRoutes);
                finalRouteConfig && (finalRouteConfig.routes = routes);
                return (
                  <Router history={history}>
                    {createRoutes ? (
                      <App {...props} Component={createRoutes()} />
                    ) : (
                      <App {...props}>
                        {renderRoutes(finalRouteConfig, props)}
                      </App>
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
                  ? urlJoin(
                      baseUrl,
                      config.router?.basename?.replace(/^\/*/, '/') ||
                        (historyOptions.basename as string),
                    )
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
                    <App {...props} Component={createRoutes()} />
                  ) : (
                    <App {...props}>
                      {renderRoutes(finalRouteConfig, props)}
                    </App>
                  )}
                </StaticRouter>
              );
            };
          };

          const RouteApp = getRouteApp();

          return next({
            App: RouteApp,
            config,
          });
        },
      };
    },
  };
};
