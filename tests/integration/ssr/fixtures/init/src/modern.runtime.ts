import { type RuntimePlugin, defineRuntimeConfig } from '@modern-js/runtime';

const initPlugin = (): RuntimePlugin => {
  return {
    name: 'init-plugin',
    setup: api => {
      api.onBeforeRender(async context => {
        const { request } = context.context!;

        if (context.isBrowser && !context?.initialData?.name) {
          return {
            name: 'client',
          };
        } else if (!request.query.browser) {
          return {
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
