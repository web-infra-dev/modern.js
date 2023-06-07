import { Suspense } from 'react';
import { matchRoutes, useLocation } from 'react-router-dom';
import { normalizeRoutePath } from './utils';

const { routes } = process.env.__SSR__
  ? (require('virtual-routes-ssr') as typeof import('virtual-routes-ssr'))
  : (require('virtual-routes') as typeof import('virtual-routes'));

export const Content = () => {
  const { pathname } = useLocation();
  const matched = matchRoutes(routes, normalizeRoutePath(pathname));
  if (!matched) {
    return <div></div>;
  }
  const routesElement = matched[0].route.element;
  // There is no need to use Suspense in SSR mode
  // The component in SSR is imported synchronously
  return process.env.__SSR__ ? (
    routesElement
  ) : (
    <Suspense fallback={<></>}>{routesElement}</Suspense>
  );
};
