import type { RuntimePluginFuture } from '@modern-js/runtime';

export const configPlugin = (): RuntimePluginFuture => {
  return {
    name: 'app-custom-config-plugin',
    post: ['@modern-js/plugin-router'],
    setup: api => {
      api.config(() => {
        return {
          router: {
            basename: 'test',
          },
        };
      });
    },
  };
};
