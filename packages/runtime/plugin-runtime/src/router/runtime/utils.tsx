// eslint-disable-next-line @typescript-eslint/no-unused-vars
import React from 'react';
import { Routes, Route, matchPath, Outlet } from 'react-router-dom';
import { RouterConfig } from './plugin';
import { DefaultNotFound } from './DefaultNotFound';

const Layout = ({ GlobalLayout, Component, ...props }: any) => {
  return GlobalLayout ? (
    <GlobalLayout Component={Component} {...props} />
  ) : (
    <Component {...props} />
  );
};

export function renderRoutes(
  routesConfig: RouterConfig['routesConfig'],
  pathname: string,
  extraProps: any = {},
) {
  const findMatchedRoute = (pathname: string) =>
    routesConfig?.routes?.find(route => {
      const info = matchPath(
        {
          path: route.path as string,
          caseSensitive: route.caseSensitive,
        },
        pathname,
      );

      return Boolean(info);
    });

  const matchedRoute = findMatchedRoute(pathname);

  if (!matchedRoute) {
    return <DefaultNotFound />;
  }

  // legacy '/apple' -> 'apple'
  const path = matchedRoute.path?.startsWith('/')
    ? matchedRoute.path.substring(1)
    : matchedRoute.path;

  return (
    <Routes>
      <Route path="/*" element={<Outlet />}>
        <Route
          path={path}
          caseSensitive={matchedRoute.caseSensitive}
          element={
            <Layout
              GlobalLayout={routesConfig?.globalApp}
              Component={matchedRoute.component}
              {...extraProps}
            />
          }
        />
      </Route>
    </Routes>
  );
}

export function getLocation(serverContext: any): string {
  const { pathname, url }: { [p: string]: string } =
    serverContext?.request || {};

  const cleanUrl = url?.replace('http://', '')?.replace('https://', '');

  const index = (cleanUrl || '').indexOf(pathname);

  if (index === -1) {
    return pathname;
  }

  return cleanUrl.substring(index);
}

export const urlJoin = (...parts: string[]) => {
  const separator = '/';
  const replace = new RegExp(`${separator}{1,}`, 'g');
  return standardSlash(parts.join(separator).replace(replace, separator));
};

export function standardSlash(str: string) {
  let addr = str;
  if (!addr || typeof addr !== 'string') {
    return addr;
  }
  if (addr.startsWith('.')) {
    addr = addr.slice(1);
  }
  if (!addr.startsWith('/')) {
    addr = `/${addr}`;
  }
  if (addr.endsWith('/') && addr !== '/') {
    addr = addr.slice(0, addr.length - 1);
  }

  return addr;
}
