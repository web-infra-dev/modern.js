import { useRuntimeContext } from '@modern-js/runtime';
import {
  StaticRouterProvider,
  createStaticRouter,
} from '@modern-js/runtime-utils/router';
import { routes } from './routes';

const App = () => {
  const { customRouterContext } = useRuntimeContext();
  const router = createStaticRouter(routes, customRouterContext);
  return <StaticRouterProvider router={router} context={customRouterContext} />;
};

export default App;
