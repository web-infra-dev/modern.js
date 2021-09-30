import React, { useContext } from 'react';
import {
  createBrowserHistory,
  createHashHistory,
  History,
  BrowserHistoryBuildOptions,
  HashHistoryBuildOptions,
} from 'history';
import { Router, StaticRouter, RouteProps } from 'react-router-dom';
import { createPlugin, RuntimeReactContext } from '@modern-js/runtime-core';
import { resolveBasename, renderRoutes, getLocation } from './utils';

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
  routesConfig?: {
    globalApp?: React.ComponentType<any>;
    routes?: SingleRouteConfig[];
  };
  history?: History;
};

// todo: check
const isBrowser = () => typeof window !== 'undefined';

export const routerPlugin: any = ({
  history: customHistory,
  supportHtml5History = true,
  routesConfig,
  historyOptions,
}: RouterConfig) => {
  const isBrow = isBrowser();
  // eslint-disable-next-line no-nested-ternary
  const history = isBrow
    ? customHistory || supportHtml5History
      ? createBrowserHistory(historyOptions)
      : createHashHistory(historyOptions)
    : ({} as History);

  return createPlugin(
    () => ({
      hoc: ({ App }, next) => {
        const getRouteApp = () => {
          if (isBrow) {
            return (props: any) => (
              <Router history={history}>
                {routesConfig ? (
                  renderRoutes(routesConfig, props)
                ) : (
                  <App {...props} />
                )}
              </Router>
            );
          }

          return (props: any) => {
            const runtimeContext = useContext(RuntimeReactContext);
            const basename = resolveBasename(historyOptions?.basename);
            const location = getLocation(runtimeContext?.ssrContext);
            const ctx = runtimeContext?.ssrContext?.redirection || {};

            return (
              <StaticRouter
                basename={basename}
                location={location}
                context={ctx}>
                {routesConfig ? (
                  renderRoutes(routesConfig, props)
                ) : (
                  <App {...props} />
                )}
              </StaticRouter>
            );
          };
        };

        return next({ App: getRouteApp() });
      },
    }),
    { name: `@modern-js/plugin-router` },
  );
};
