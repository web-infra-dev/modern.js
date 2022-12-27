import { createContext, useContext } from 'react';
import { PageData } from 'shared/types';
import siteData from 'virtual-site-data';
import { routes } from 'virtual-routes';
import { Route } from '../node/route/RouteService';
import { addLeadingSlash, inBrowser, normalizeSlash } from '@/shared/utils';

// Type shim for window.__EDEN_PAGE_DATA__
declare global {
  interface Window {
    __MODERN_PAGE_DATA__: any;
  }
}
interface IDataContext {
  data: PageData;
  setData?: (data: PageData) => void;
}

export const DataContext = createContext(
  inBrowser()
    ? // eslint-disable-next-line @typescript-eslint/no-empty-function
      { data: window.__MODERN_PAGE_DATA__, setData: () => {} }
    : ({} as IDataContext),
);

export function usePageData() {
  const ctx = useContext(DataContext);
  return ctx.data;
}

export function withBase(url = '/'): string {
  const normalizedBase = normalizeSlash(siteData.base);
  const normalizedUrl = addLeadingSlash(url);
  return `${normalizedBase}${normalizedUrl}`;
}

export function removeBase(url: string): string {
  const normalizedBase = normalizeSlash(siteData.base);
  return url.replace(normalizedBase, '');
}

export const getAllPages = (
  filter: (route: Route) => boolean = () => true,
): Promise<PageData[]> => {
  return Promise.all(
    routes.filter(filter).map(async route => {
      const mod = await route.preload();
      return {
        ...mod,
        routePath: route.path,
      };
    }),
  );
};
