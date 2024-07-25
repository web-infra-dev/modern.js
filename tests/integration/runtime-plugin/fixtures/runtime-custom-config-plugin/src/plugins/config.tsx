import { Plugin } from '@modern-js/runtime';

export const configPlugin = (): Plugin => {
  return {
    name: 'app-custom-config-plugin',
    post: ['@modern-js/plugin-router'],
    setup: _api => {
      return {
        modifyRuntimeConfig(config) {
          return {
            ...config,
            router: {
              basename: 'test',
            },
          };
        },
      };
    },
  };
};
