import { type RuntimePlugin, defineRuntimeConfig } from '@modern-js/runtime';
import { createStaticHandler } from '@modern-js/runtime-utils/router';
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

const initPlugin = (): RuntimePlugin => {
  return {
    name: 'init-plugin',
    setup: api => {
      api.onBeforeRender(async context => {
        if (context.isBrowser) {
          return;
        }
        const { ssrContext } = context;
        const { query } = createStaticHandler(routes);
        if (!ssrContext || !ssrContext.request) {
          return null;
        }
        const fetchRequest = createFetchRequest(ssrContext.request as any);
        context.customRouterContext = await query(fetchRequest);
      });
    },
  };
};
export default defineRuntimeConfig({
  plugins: [initPlugin()],
});
