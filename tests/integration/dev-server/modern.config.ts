import type { AppTools, CliPlugin } from '@modern-js/app-tools';
import { applyBaseConfig } from '../../utils/applyBaseConfig';

const plugin = (): CliPlugin<AppTools> => {
  return {
    name: 'test',

    setup(api) {
      api.config(() => {
        return {
          dev: {
            setupMiddlewares: [
              (middlewares, _) => {
                middlewares.push((req, res, next) => {
                  res.setHeader('x-plugin', 'test-plugin');
                  next();
                });
              },
            ],
          },
        };
      });
    },
  };
};

export default applyBaseConfig({
  plugins: [plugin()],
  dev: {
    setupMiddlewares: [
      (middlewares, _) => {
        middlewares.push((req, res, next) => {
          res.setHeader('x-config', 'test-config');
          next();
        });

        middlewares.push((req, res, next) => {
          res.setHeader('x-push-middleware', 'test-middleware');
          return next();
        });

        middlewares.unshift((req, res, next) => {
          res.setHeader('x-unshift-middleware', 'test-middleware');
          return next();
        });
      },
    ],
  },
});
