import { routes } from 'virtual-routes';
import { matchRoutes, useLocation } from 'react-router-dom';
import { Suspense } from 'react';
import { normalizeRoutePath } from './utils';

export const Content = () => {
  const { pathname } = useLocation();
  const matched = matchRoutes(routes, normalizeRoutePath(pathname));
  if (!matched) {
    return <div></div>;
  }
  const routesElement = matched[0].route.element;
  return <Suspense>{routesElement}</Suspense>;
};
