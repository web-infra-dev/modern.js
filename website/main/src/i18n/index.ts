import { withBase, useLang } from '@modern-js/doc-tools/runtime';
import { EN_US } from './en-US';
import { ZH_CN } from './zh-CN';

const translations = {
  en: EN_US,
  zh: ZH_CN,
} as const;

export function useUrl(url: string) {
  const lang = useLang();
  return withBase(lang === 'zh' ? url : `/en${url}`);
}

export function useI18n() {
  const lang = useLang() as keyof typeof translations;
  return (key: keyof typeof EN_US) => translations[lang][key];
}
