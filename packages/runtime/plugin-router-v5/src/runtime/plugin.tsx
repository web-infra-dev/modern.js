import { RuntimeReactContext, isBrowser } from '@meta/runtime';
import { getGlobalLayoutApp, getGlobalRoutes } from '@meta/runtime/context';
import type { RuntimePluginFuture } from '@modern-js/runtime';
import { merge } from '@modern-js/runtime-utils/merge';
import {
  type BrowserHistoryBuildOptions,
  type HashHistoryBuildOptions,
  type History,
  createBrowserHistory,
  createHashHistory,
} from 'history';
import type React from 'react';
import { useContext } from 'react';
import {
  type RouteProps,
  Router,
  StaticRouter,
  useHistory,
  useLocation,
  useRouteMatch,
} from 'react-router-dom';
import { modifyRoutesHook } from './hooks';
import { getLocation, renderRoutes, urlJoin } from './utils';

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

export const routerPlugin = (
  userConfig: RouterConfig = {},
): RuntimePluginFuture<{
  extendHooks: {
    modifyRoutes: typeof modifyRoutesHook;
  };
}> => {
  return {
    name: '@modern-js/plugin-router',
    registryHooks: {
      modifyRoutes: modifyRoutesHook,
    },
    setup: api => {
      api.onBeforeRender(context => {
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
      });
      api.wrapRoot(App => {
        const pluginConfig: Record<string, any> = api.getRuntimeConfig();
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

        const getRouteApp = () => {
          if (isBrow) {
            return (props: any) => {
              const runtimeContext = useContext(RuntimeReactContext);
              const baseUrl = select(location.pathname).replace(/^\/*/, '/');
              const basename =
                baseUrl === '/'
                  ? urlJoin(
                      baseUrl,
                      runtimeContext._internalRouterBaseName ||
                        (historyOptions.basename as string),
                    )
                  : baseUrl;

              historyOptions.basename = basename;
              const history =
                customHistory ||
                (supportHtml5History
                  ? createBrowserHistory(historyOptions)
                  : createHashHistory(historyOptions));
              const hooks = api.getHooks();
              routes = hooks.modifyRoutes.call(originRoutes);
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
            const baseUrl = (request?.baseUrl as string)?.replace(/^\/*/, '/');

            const basename =
              baseUrl === '/'
                ? urlJoin(
                    baseUrl,
                    runtimeContext._internalRouterBaseName ||
                      (historyOptions.basename as string),
                  )
                : baseUrl;
            const hooks = api.getHooks();
            const routes = hooks.modifyRoutes.call(originRoutes);
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
      });
    },
  };
};
