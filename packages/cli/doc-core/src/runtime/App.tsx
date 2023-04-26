import siteData from 'virtual-site-data';
import { matchRoutes, useLocation } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { useContext, useLayoutEffect } from 'react';
import Theme from '@theme';
import { isEqualPath, normalizeRoutePath } from './utils';
import { DataContext } from './hooks';
import { PageData } from '@/shared/types';
import { cleanUrl, isProduction } from '@/shared/utils';
import 'virtual-global-styles';

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
    const extractPageInfo = siteData.pages.find(page => {
      const normalize = (p: string) =>
        // compat the path that has no / suffix
        p.replace(/\/$/, '').replace(`/${page.lang}`, '');
      return isEqualPath(normalize(page.routePath), normalize(routePath));
    });
    return {
      siteData,
      page: {
        pagePath,
        pageType: mod?.frontmatter?.pageType || 'doc',
        frontmatter: mod?.frontmatter || {},
        ...extractPageInfo,
        // Trade off:
        // 1. the `extractPageInfo` includes complete toc even if import doc fragments, because we use `flattenMdxContent` function to make all doc fragments' toc included.However, it is only computed once when build
        // 2. the mod.toc is not complete toc, but it is computed every time through loader when doc changed
        // We choose the better solutions for different environments:
        // In production, we use the extractPageInfo.toc to ensure the toc is complete and accurate.
        // In development, we use the mod.toc to ensure the toc is up to date to ensure DX.However, we cannot ensure the complete toc info when including doc fragments.
        toc: isProduction() ? extractPageInfo.toc : mod.toc,
      },
    };
  } else {
    // 404 Page
    return {
      siteData,
      page: {
        pagePath: '',
        pageType: '404',
        routePath: '/404',
        lang: siteData.lang || '',
        frontmatter: {},
        title: '404',
        toc: [],
      },
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
        setPageData(pageData);
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
