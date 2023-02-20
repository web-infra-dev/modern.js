import { NormalizedLocales } from 'shared/types';
import { usePageData } from '@/runtime';

export function useLocaleSiteData(): NormalizedLocales {
  const pageData = usePageData();
  const { lang } = pageData;
  const themeConfig = pageData?.siteData?.themeConfig ?? {};
  const defaultLang = pageData.siteData.lang ?? '';
  const locales = themeConfig?.locales;

  if (!locales || locales.length === 0) {
    return {
      nav: themeConfig.nav,
      sidebar: themeConfig.sidebar,
      prevPageText: themeConfig.prevPageText,
      nextPageText: themeConfig.nextPageText,
    } as NormalizedLocales;
  }
  const localeInfo = locales.find(locale => locale.lang === lang)!;
  return {
    ...localeInfo,
    langRoutePrefix: lang === defaultLang ? '/' : lang,
  } as NormalizedLocales;
}
