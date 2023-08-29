import { useLang, withBase } from 'rspress/runtime';

export function useUrl(url: string) {
  const lang = useLang();
  return withBase(lang === 'zh' ? url : `/en${url}`);
}
