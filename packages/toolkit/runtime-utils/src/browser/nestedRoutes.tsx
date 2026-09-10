import type { NestedRoute } from '@modern-js/types';
import { LOADER_REPORTER_NAME } from '@modern-js/utils/universal/constants';
/**
 * runtime utils for nested routes generating
 */
import type React from 'react';
import { type JSX, Suspense } from 'react';
import {
  type LoaderFunction,
  type LoaderFunctionArgs,
  Outlet,
  Route,
  type RouteProps,
  createRoutesFromElements,
} from 'react-router';
import { time } from '../time';
import { getAsyncLocalStorage } from '../universal/async_storage';
import {
  DeferredData,
  activeDeferreds as originalActiveDeferreds,
} from './deferreds';

const privateDefer = (data: any) => {
  return new DeferredData(data);
};

export const transformNestedRoutes = (routes: NestedRoute[]) => {
  const routeElements = [];
  for (const route of routes) {
    const routeElement = renderNestedRoute(route);
    routeElements.push(routeElement);
  }

  return createRoutesFromElements(routeElements);
};

type DeferredDataComponentType = (props?: {
  nonce?: string;
}) => JSX.Element | null;

export const renderNestedRoute = (
  nestedRoute: NestedRoute,
  options: {
    parent?: NestedRoute;
    DeferredDataComponent?: DeferredDataComponentType;
    props?: Record<string, any>;
  } = {},
) => {
  const { children, index, id, component, isRoot, lazyImport, config, handle } =
    nestedRoute;
  const Component = component as unknown as React.ComponentType<any>;
  const { parent, props = {} } = options;

  const routeProps: Omit<RouteProps, 'children' | 'lazy'> = {
    caseSensitive: nestedRoute.caseSensitive,
    path: nestedRoute.path,
    id: nestedRoute.id,
    loader: createLoader(nestedRoute),
    action: nestedRoute.action,
    hasErrorBoundary: nestedRoute.hasErrorBoundary,
    shouldRevalidate: nestedRoute.shouldRevalidate,
    handle: {
      ...handle,
      ...(typeof config === 'object' ? config?.handle : {}),
    },
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
      element = <Component {...props} />;
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
    // If the component is undefined, it must be a layout component.
    routeProps.element = <Outlet />;
  }

  if (element) {
    routeProps.element = element;
  }

  if (nestedRoute.loading) {
    routeProps.hydrateFallbackElement = <nestedRoute.loading />;
  }

  const childElements = children?.map(childRoute => {
    return renderNestedRoute(childRoute, {
      parent: nestedRoute,
    });
  });

  const routeElement = index ? (
    <Route key={id} {...routeProps} index={true as const} />
  ) : (
    <Route key={id} {...routeProps} index={false as const}>
      {childElements}
    </Route>
  );

  return routeElement;
};

function isPlainObject(value: any): value is Record<string, any> {
  return (
    value != null &&
    typeof value === 'object' &&
    Object.getPrototypeOf(value) === Object.prototype
  );
}

async function getRequestWork() {
  if (typeof document !== 'undefined') return undefined;
  try {
    return (await getAsyncLocalStorage())?.useContext()?.work;
  } catch {
    return undefined;
  }
}

function holdRequestWork(work: Awaited<ReturnType<typeof getRequestWork>>) {
  let finish = () => {};
  if (work) {
    const running = new Promise<void>(done => {
      finish = done;
    });
    // Reject an expired lease before invoking any business code.
    work.track(running);
  }
  return finish;
}

function createLoader(route: NestedRoute): LoaderFunction {
  const { loader } = route;
  if (loader) {
    return async (args: LoaderFunctionArgs) => {
      const work =
        typeof document === 'undefined' ? await getRequestWork() : undefined;
      const finish = holdRequestWork(work);
      try {
        if (typeof route.lazyImport === 'function') {
          const importing = route.lazyImport();
          if (importing) work?.track(Promise.resolve(importing));
        }
        const end = time();
        const loading = Promise.resolve(loader(args));
        work?.track(loading);
        const res = await loading;
        // Track originals before DeferredData wraps them in a cancellation race.
        if (isPlainObject(res) && work) {
          work.track(Promise.allSettled(Object.values(res)));
        }
        let activeDeferreds = null;
        if (typeof document === 'undefined') {
          activeDeferreds = (await getAsyncLocalStorage())?.useContext()
            ?.activeDeferreds as Map<string, DeferredData>;
        } else {
          activeDeferreds = originalActiveDeferreds;
        }
        if (isPlainObject(res)) {
          const deferredData = privateDefer(res);
          activeDeferreds.set(route.id!, deferredData);
        }

        const cost = end();
        if (typeof document === 'undefined') {
          const storage = await getAsyncLocalStorage();
          storage
            ?.useContext()
            .monitors?.timing(
              `${LOADER_REPORTER_NAME}-${route.id?.replace(/\//g, '_')}`,
              cost,
            );
        }
        return res;
      } finally {
        finish();
      }
    };
  } else {
    return () => {
      if (typeof document === 'undefined') {
        return getRequestWork().then(work => {
          const finish = holdRequestWork(work);
          try {
            const importing = route.lazyImport?.();
            if (importing) work?.track(Promise.resolve(importing));
            return null;
          } finally {
            finish();
          }
        });
      }
      route.lazyImport?.();
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
