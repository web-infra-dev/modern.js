import { LocaleConfig } from 'shared/types';
import { useLocation } from 'react-router-dom';
import { usePageData, withBase } from '@/runtime';
import { normalizeSlash } from '@/shared/utils/index';

export function useLocaleSiteData(): LocaleConfig {
  const pageData = usePageData();

  const { pathname } =
    // eslint-disable-next-line react-hooks/rules-of-hooks
    process.env.NODE_ENV === 'production' ? useLocation() : location;
  const themeConfig = pageData?.siteData?.themeConfig ?? {};
  const defaultLang = pageData.siteData.lang ?? 'zh';
  const locales = themeConfig?.locales;
  if (!locales || locales.length === 0) {
    return {
      nav: themeConfig.nav,
      sidebar: themeConfig.sidebar,
      prevPageText: themeConfig.prevPageText,
      nextPageText: themeConfig.nextPageText,
    } as LocaleConfig;
  }
  const localeKeys = locales.map(locale => locale.lang);
  const localeKey =
    localeKeys.find(locale => {
      const normalizedLocalePrefix = withBase(normalizeSlash(locale));
      return pathname.startsWith(normalizedLocalePrefix);
    }) || localeKeys[0];
  const localeInfo = locales.find(locale => locale.lang === localeKey)!;
  return {
    ...localeInfo,
    langRoutePrefix:
      localeKey === defaultLang ? withBase('/') : withBase(localeKey),
  };
}
