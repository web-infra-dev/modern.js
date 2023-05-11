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

  return routesElement;
};
