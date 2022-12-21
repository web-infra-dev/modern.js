import siteData from 'virtual-site-data';
import { matchRoutes, useLocation } from 'react-router-dom';
import { Route, routes } from 'virtual-routes';
import { HelmetProvider } from 'react-helmet-async';
import { useContext, useLayoutEffect } from 'react';
import Theme from '../theme-default';
import { getRelativePagePath } from './utils';
import { DataContext } from './hooks';
import { PageData } from '@/shared/types';
import { cleanUrl, omit } from '@/shared/utils';

export async function initPageData(routePath: string): Promise<PageData> {
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
    const isOverviewPage = mod?.frontmatter?.overview;
    // Overview Page
    if (isOverviewPage) {
      const subModules = await Promise.all(
        routes
          .filter(
            (route: Route) =>
              route.path.startsWith(routePath.replace(/overview$/, '')) &&
              route !== matchedRoute,
          )
          .map(async (route: Route) => {
            const mod = await route.preload();
            return {
              ...mod,
              routePath: route.path,
            };
          }),
      );
      return {
        siteData,
        pagePath,
        relativePagePath,
        subModules,
        ...omit(mod, ['default']),
        pageType: 'doc',
        routePath,
      };
    } else {
      // Doc/Custom Page
      return {
        siteData,
        pagePath,
        relativePagePath,
        ...omit(mod, ['default']),
        pageType: mod?.frontmatter?.pageType || 'doc',
        routePath,
      } as PageData;
    }
  } else {
    // 404 Page
    return {
      siteData,
      pagePath: '',
      relativePagePath: '',
      pageType: '404',
      routePath: '/404',
    };
  }
}

export function App({ helmetContext }: { helmetContext?: object }) {
  const { setData: setPageData } = useContext(DataContext);
  const { pathname } = useLocation();
  useLayoutEffect(() => {
    async function refetchData() {
      try {
        const pageData = await initPageData(pathname);
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
