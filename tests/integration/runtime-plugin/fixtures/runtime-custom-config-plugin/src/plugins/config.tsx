import type { RuntimePlugin } from '@modern-js/runtime';

export const configPlugin = (): RuntimePlugin => {
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
