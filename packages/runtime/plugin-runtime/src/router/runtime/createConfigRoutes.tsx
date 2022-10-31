// config routes

import { useLocation, Navigate, useNavigate } from 'react-router-dom';
import type { RouteObject } from 'react-router-dom';
import React from 'react';
import { Helmet } from '../../exports/head';

// config routes can't used for data fetch feature (nested)
// so don't define by Omit<RouteObject, 'element' | 'children'>
export type Route = {
  index?: boolean;
  path: string;
  component: any;
  caseSensitive?: boolean;
  redirect?: string;
  title?: string;
  children?: Route[];
};

export type Routes = Route[];

interface IConfigRouteProps {
  redirect?: string;
  component?: any;
  loading?: React.ComponentType<any>;
  lazy?: boolean;
  title?: string;
}

interface IConfigRoutesProps {
  routes: Routes;
  lazy?: boolean;
  loading?: React.ComponentType<any>;
}

const DefaultLoading = () => <div>loading ... </div>;

export const ConfigRoute = ({
  redirect,
  component: Component,
  loading: Loading,
  lazy,
  title,
  ...extraProps
}: IConfigRouteProps): JSX.Element => {
  const navigate = useNavigate();
  const location = useLocation();
  if (redirect) {
    return <Navigate to={redirect} />;
  }
  if (!Component) {
    return <></>;
  }

  const Element = (
    <>
      {title ? (
        <Helmet>
          <title>{title}</title>
        </Helmet>
      ) : null}
      <Component
        navigate={navigate}
        location={location}
        fallback={Loading ? <Loading /> : <DefaultLoading />}
        {...extraProps}
      />
    </>
  );

  return Element;
};

const transformRoutes = ({
  routes = [],
  loading,
  lazy,
  extraProps,
}: {
  routes: Routes;
  loading?: React.ComponentType<any>;
  lazy?: boolean;
  extraProps?: any;
}): Routes => {
  const final = [];
  for (const route of routes) {
    const parent = {
      ...route,
      // specific redirect, route.component is optional
      element:
        !route.component && !route.redirect ? undefined : (
          <ConfigRoute
            redirect={route.redirect}
            component={route.component}
            title={route.title}
            loading={loading}
            lazy={lazy}
            {...extraProps}
          />
        ),
    };
    if (parent.children) {
      parent.children = transformRoutes({
        routes: parent.children,
        lazy,
        loading,
        extraProps,
      });
    }
    final.push(parent);
  }
  return final;
};

const createConfigRoutes = ({
  routes,
  lazy,
  loading,
  ...extraProps
}: IConfigRoutesProps): RouteObject[] => {
  return transformRoutes({
    routes,
    lazy,
    loading,
    extraProps,
  }) as RouteObject[];
};

export default createConfigRoutes;
