import { type RuntimePlugin, defineRuntimeConfig } from '@modern-js/runtime';

const initPlugin = (): RuntimePlugin => {
  return {
    name: 'init-plugin',
    setup: api => {
      api.onBeforeRender(context => {
        context.initialData = {
          data: 'init data',
        };
      });
    },
  };
};
export default defineRuntimeConfig({
  plugins: [initPlugin()],
});
