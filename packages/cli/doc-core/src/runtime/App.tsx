import siteData from 'virtual-site-data';
import { matchRoutes, useLocation } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { useContext, useLayoutEffect } from 'react';
import Theme from '@theme';
import { getRelativePagePath, normalizeRoutePath } from './utils';
import { DataContext } from './hooks';
import { PageData } from '@/shared/types';
import { cleanUrl, omit } from '@/shared/utils';

export async function initPageData(routePath: string): Promise<PageData> {
  const { routes } = process.env.__SSR__
    ? (require('virtual-routes-ssr') as typeof import('virtual-routes-ssr'))
    : (require('virtual-routes') as typeof import('virtual-routes'));
  const matched = matchRoutes(routes, routePath)!;
  if (matched) {
    // Preload route component
    const matchedRoute = matched[0].route;
    const mod = await matchedRoute.preload();
    const pagePath = cleanUrl(matched[0].route.filePath);
    const relativePagePath = getRelativePagePath(
      routePath,
      pagePath,
      siteData?.base || '/',
    );
    return {
      siteData,
      pagePath,
      relativePagePath,
      ...omit(mod, ['default']),
      pageType: mod?.frontmatter?.pageType || 'doc',
      routePath,
      lang: matchedRoute.lang,
    } as PageData;
  } else {
    // 404 Page
    return {
      siteData,
      pagePath: '',
      relativePagePath: '',
      pageType: '404',
      routePath: '/404',
      lang: siteData.lang || '',
    };
  }
}

export function App({ helmetContext }: { helmetContext?: object }) {
  const { setData: setPageData } = useContext(DataContext);
  const { pathname } = useLocation();
  useLayoutEffect(() => {
    async function refetchData() {
      try {
        const pageData = await initPageData(normalizeRoutePath(pathname));
        setPageData!(pageData);
      } catch (e) {
        // eslint-disable-next-line no-console
        console.log(e);
      }
    }
    refetchData();
  }, [pathname, setPageData]);
  return (
    <HelmetProvider context={helmetContext}>
      <Theme.Layout />
    </HelmetProvider>
  );
}
