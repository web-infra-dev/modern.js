// eslint-disable-next-line @typescript-eslint/no-unused-vars
import React from 'react';
import { RouterConfig } from './plugin';

const Layout = ({ GlobalLayout, Component, ...props }: any) => {
  return GlobalLayout ? (
    <GlobalLayout Component={Component} {...props} />
  ) : (
    <Component {...props} />
  );
};

export function renderRoutes(
  routesConfig: RouterConfig['routesConfig'],
  extraProps: any = {},
) {
  return routesConfig?.routes?.map(item => ({
    path: item.path?.startsWith('/') ? item.path.substring(1) : item.path, // legacy: '/about' -> 'about'
    element: (
      <Layout
        GlobalLayout={routesConfig.globalApp}
        Component={item.component}
        {...extraProps}
      />
    ),
  }));
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
