import { routes } from 'virtual-routes';
import { useRoutes } from 'react-router-dom';

export function Content() {
  const rootElement = useRoutes(routes);
  return <div>{rootElement}</div>;
}
