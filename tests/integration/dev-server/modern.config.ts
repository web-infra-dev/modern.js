import { appTools, defineConfig } from '@modern-js/app-tools';

const plugin = () => {
  return {
    name: 'test',

    setup() {
      return {
        config() {
          return {
            tools: {
              devServer: {
                before: [
                  (req, res, next) => {
                    res.setHeader('x-plugin', 'test-plugin');
                    next();
                  },
                ],
              },
            },
          };
        },
      };
    },
  };
};

export default defineConfig({
  plugins: [appTools(), plugin()],
  tools: {
    devServer: {
      before: [
        (req, res, next) => {
          res.setHeader('x-config', 'test-config');
          next();
        },
      ],
    },
  },
  runtime: {
    router: true,
    state: false,
  },
});
