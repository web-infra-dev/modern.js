import type { RuntimeContext } from '@modern-js/runtime';
import {
  StaticRouterProvider,
  createStaticHandler,
  createStaticRouter,
} from '@modern-js/runtime-utils/node/router';
import { routes } from './routes';

function createFetchRequest(request: Request) {
  const method = 'GET';
  const { headers } = request;
  const controller = new AbortController();

  return new Request(request.url, {
    method,
    headers,
    signal: controller.signal,
  });
}

let routerContext: any;
const App = () => {
  const router = createStaticRouter(routes, routerContext);
  return <StaticRouterProvider router={router} context={routerContext} />;
};

App.init = async (context: RuntimeContext) => {
  const { ssrContext } = context;
  const { query } = createStaticHandler(routes);
  if (!ssrContext || !ssrContext.request) {
    return null;
  }
  const fetchRequest = createFetchRequest(ssrContext.request as any);
  routerContext = await query(fetchRequest);
};

export default App;
