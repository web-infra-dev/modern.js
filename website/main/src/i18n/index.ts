import { useLocation, withBase } from '@modern-js/doc-tools/runtime';
import { EN_US } from './en-US';
import { ZH_CN } from './zh-CN';

const translations = {
  en: EN_US,
  zh: ZH_CN,
} as const;

const removeTrailingSlash = (path: string) => {
  return path.endsWith('/') ? path.slice(0, -1) : path;
};

export function useLang() {
  const location = useLocation();
  const langPrefix =
    location.pathname === '/' ? '' : removeTrailingSlash(location.pathname);
  return langPrefix.includes('en') ? 'en' : 'zh';
}

export function useUrl(url: string) {
  const lang = useLang();
  return withBase(lang === 'zh' ? url : `/en${url}`);
}

export function useI18n() {
  const lang = useLang();
  return (key: keyof typeof EN_US) => translations[lang][key];
}
