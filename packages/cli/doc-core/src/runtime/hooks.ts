import { createContext, useContext } from 'react';
import { PageData } from 'shared/types';
import i18nTextData from 'virtual-i18n-text';

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

interface IThemeContext {
  theme: 'light' | 'dark';
  setTheme?: (theme: 'light' | 'dark') => void;
}

export const DataContext = createContext({} as IDataContext);

export const ThemeContext = createContext({} as IThemeContext);

export function usePageData() {
  const ctx = useContext(DataContext);
  return ctx.data;
}

export function useLang(): string {
  const ctx = useContext(DataContext);
  return ctx.data.page.lang || '';
}

export function useDark() {
  const ctx = useContext(ThemeContext);
  return ctx.theme === 'dark';
}

export function useI18n<T = Record<string, Record<string, string>>>() {
  const lang = useLang();

  return (key: keyof T) => i18nTextData[key][lang];
}
