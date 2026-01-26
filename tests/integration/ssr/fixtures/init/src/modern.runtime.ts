import { type RuntimePlugin, defineRuntimeConfig } from '@modern-js/runtime';

const initPlugin = (): RuntimePlugin => {
  return {
    name: 'init-plugin',
    setup: api => {
      api.onBeforeRender(async context => {
        const { request } = context.context!;

        if (context.isBrowser && !context?.initialData?.name) {
          context.initialData = {
            ...context.initialData,
            name: 'client',
          };
        } else if (!request.query.browser) {
          context.initialData = {
            ...(context.initialData || {}),
            name: 'server',
          };
        }

        return {};
      });
    },
  };
};
export default defineRuntimeConfig({
  plugins: [initPlugin()],
});
