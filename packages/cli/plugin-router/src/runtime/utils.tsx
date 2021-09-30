import React from 'react';
import { Route, matchPath } from 'react-router-dom';
import { DefaultNotFound } from './DefaultNotFound';
import { RouterConfig } from './plugin';

export function renderRoutes(
  routesConfig: RouterConfig['routesConfig'],
  extraProps: any = {},
) {
  const Layout = ({ Component, ...props }: any) => {
    const GlobalLayout = routesConfig?.globalApp;

    if (!GlobalLayout) {
      return <Component {...props} />;
    }

    return <GlobalLayout Component={Component} {...props} />;
  };

  const findMatchedRoute = (pathname: string) =>
    routesConfig?.routes?.find(route => {
      const info = matchPath(pathname, {
        path: route.path,
        exact: route.exact,
        sensitive: route.sensitive,
      });

      return Boolean(info);
    });

  return (
    <Route
      path="/"
      render={props => {
        const matchedRoute = findMatchedRoute(props.location.pathname);

        if (!matchedRoute) {
          return <DefaultNotFound />;
        }

        return (
          <Route
            path={matchedRoute.path}
            exact={matchedRoute.exact}
            sensitive={matchedRoute.sensitive}
            render={routeProps => (
              <Layout
                Component={matchedRoute.component}
                {...routeProps}
                {...extraProps}
              />
            )}
          />
        );
      }}
    />
  );
}

export function getLocation(serverContext: any): string {
  const { pathname, url }: { [p: string]: string } =
    serverContext?.request || {};
  const index = (url || '').indexOf(pathname);

  if (index === -1) {
    return pathname;
  }

  return url.substring(index);
}

export function resolveBasename(basename?: string): string {
  if (typeof basename !== 'string') {
    return '';
  }

  if (basename.endsWith('/')) {
    return resolveBasename(basename.substr(0, basename.length - 1));
  }

  return basename;
}
