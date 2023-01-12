import { createContext, useContext } from 'react';
import { PageData } from 'shared/types';

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
