import { NestedRoute } from '@modern-js/types';
import { Route } from '@modern-js/runtime-utils/router';
import { renderNestedRoute } from '@modern-js/runtime-utils/browser';
import { RouterConfig } from './types';
import { DefaultNotFound } from './DefaultNotFound';

export function getRouteComponents(
  routes: NestedRoute[],
  {
    globalApp,
    props,
  }: {
    globalApp?: React.ComponentType<any>;
    props?: Record<string, any>;
  },
) {
  const Layout = ({ Component, ...props }: any) => {
    const GlobalLayout = globalApp;
    if (!GlobalLayout) {
      return <Component {...props} />;
    }

    return <GlobalLayout Component={Component} {...props} />;
  };
  const routeElements: React.ReactElement[] = [];
  for (const route of routes) {
    if (route.type === 'nested') {
      const routeElement = renderNestedRoute(route, {
        props,
      });
      routeElements.push(routeElement);
    } else {
      const routeElement = (
        <Route
          key={route.path}
          path={route.path}
          element={<Layout Component={route.component} />}
        />
      );
      routeElements.push(routeElement);
    }
  }
  routeElements.push(<Route key="*" path="*" element={<DefaultNotFound />} />);
  return routeElements;
}

export function renderRoutes({
  routesConfig,
  props,
}: {
  routesConfig: RouterConfig['routesConfig'];
  props?: Record<string, any>;
}) {
  if (!routesConfig) {
    return null;
  }
  const { routes, globalApp } = routesConfig;
  if (!routes) {
    return null;
  }
  const routeElements = getRouteComponents(routes, {
    globalApp,
    props,
  });
  return routeElements;
}
