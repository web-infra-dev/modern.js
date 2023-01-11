import { createContext, useContext } from 'react';
import { PageData } from 'shared/types';
import siteData from 'virtual-site-data';
import { addLeadingSlash, normalizeSlash } from '@/shared/utils';

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

export const DataContext = createContext({} as IDataContext);

export function usePageData() {
  const ctx = useContext(DataContext);
  return ctx.data;
}

export function withBase(url = '/'): string {
  const normalizedUrl = addLeadingSlash(url);
  const normalizedBase = normalizeSlash(siteData.base);
  // Avoid adding base path repeatly
  return normalizedUrl.startsWith(normalizedBase)
    ? normalizedUrl
    : `${normalizedBase}${normalizedUrl}`;
}

export function removeBase(url: string): string {
  const normalizedBase = normalizeSlash(siteData.base);
  return url.replace(normalizedBase, '');
}
