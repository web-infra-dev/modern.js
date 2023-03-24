import type { NestedRoute } from '@modern-js/types';
import React, { Suspense } from 'react';
import {
  createRoutesFromElements,
  LoaderFunction,
  LoaderFunctionArgs,
  Route,
  RouteProps,
} from 'react-router-dom';

export const transformNestedRoutes = (routes: NestedRoute[]) => {
  const routeElements = [];
  for (const route of routes) {
    const routeElement = renderNestedRoute(route);
    routeElements.push(routeElement);
  }

  return createRoutesFromElements(routeElements);
};

export const renderNestedRoute = (
  nestedRoute: NestedRoute,
  options: {
    parent?: NestedRoute;
    DeferredDataComponent?: () => JSX.Element | null;
  } = {},
) => {
  const { children, index, id, component, isRoot, lazyImport } = nestedRoute;
  const Component = component as unknown as React.ComponentType<any>;
  const { parent, DeferredDataComponent } = options;

  const routeProps: Omit<RouteProps, 'children'> = {
    caseSensitive: nestedRoute.caseSensitive,
    path: nestedRoute.path,
    id: nestedRoute.id,
    loader: createLoader(nestedRoute),
    action: nestedRoute.action,
    hasErrorBoundary: nestedRoute.hasErrorBoundary,
    shouldRevalidate: nestedRoute.shouldRevalidate,
    handle: nestedRoute.handle,
    index: nestedRoute.index,
    element: nestedRoute.element,
    errorElement: nestedRoute.errorElement,
  };

  if (nestedRoute.error) {
    const errorElement = <nestedRoute.error />;
    routeProps.errorElement = errorElement;
  }

  let element;

  if (Component) {
    if (parent?.loading && lazyImport) {
      const Loading = parent.loading;
      if (isLoadableComponent(Component)) {
        element = <Component fallback={<Loading />} />;
      } else {
        element = (
          <Suspense fallback={<Loading />}>
            <Component />
          </Suspense>
        );
      }
    } else if (isLoadableComponent(Component) && lazyImport) {
      element = <Component />;
    } else if (isRoot) {
      element = (
        <>
          <Component />
          {typeof document === 'undefined' && DeferredDataComponent && (
            <DeferredDataComponent />
          )}
        </>
      );
    } else if (lazyImport) {
      element = (
        <Suspense fallback={null}>
          <Component />
        </Suspense>
      );
    } else {
      element = <Component />;
    }
  } else {
    // If the component is undefined, it means that the current component is a fake layout component,
    // and it should inherit the loading of the parent component to make the loading of the parent layout component take effect.
    // It also means when layout component is undefined, loading component in then same dir should not working.
    nestedRoute.loading = parent?.loading;
  }

  if (element) {
    routeProps.element = element;
  }

  const childElements = children?.map(childRoute => {
    return renderNestedRoute(childRoute, { parent: nestedRoute });
  });

  const routeElement = index ? (
    <Route key={id} {...routeProps} index={true} />
  ) : (
    <Route key={id} {...routeProps} index={false}>
      {childElements}
    </Route>
  );

  return routeElement;
};

function createLoader(route: NestedRoute): LoaderFunction {
  const { loader } = route;
  if (loader) {
    return (args: LoaderFunctionArgs) => {
      if (typeof route.lazyImport === 'function') {
        route.lazyImport();
      }
      return loader(args);
    };
  } else {
    return () => {
      if (typeof route.lazyImport === 'function') {
        route.lazyImport();
      }
      return null;
    };
  }
}

function isLoadableComponent(component: React.ComponentType<any>) {
  return (
    component &&
    component.displayName === 'Loadable' &&
    (component as any).preload &&
    typeof (component as any).preload === 'function'
  );
}
