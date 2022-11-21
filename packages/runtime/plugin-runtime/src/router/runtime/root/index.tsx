import React, { useContext, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import type { NestedRoute } from '@modern-js/types';
import { RuntimeReactContext } from '../../../core';
import { hanldeLoad } from './load';

interface IProps {
  children: React.ReactNode;
  routes: NestedRoute[];
}

export function RootLayout(props: IProps) {
  const location = useLocation();
  const context = useContext(RuntimeReactContext);
  useEffect(() => {
    const { routes } = props;
    hanldeLoad(routes, location, context.routeManifest);
  }, [location]);
  return <>{props.children}</>;
}
