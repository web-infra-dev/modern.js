import { routes } from 'virtual-routes';
import { useRoutes } from 'react-router-dom';
import { Suspense } from 'react';

export const Content = () => {
  const routesElement = useRoutes(routes);
  return <Suspense>{routesElement}</Suspense>;
};
