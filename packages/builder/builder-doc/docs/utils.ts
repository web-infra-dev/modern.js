import { useLang, withBase } from '@modern-js/doc-tools/runtime';

export function useUrl(url: string) {
  const lang = useLang();
  return withBase(lang === 'zh' ? url : `/en${url}`);
}
