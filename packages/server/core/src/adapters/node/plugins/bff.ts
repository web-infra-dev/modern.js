import { isWebOnly } from '@modern-js/utils';
import { getRuntimeEnv } from '../../../utils';
import { ServerPlugin } from '../../../types';
import { ServerNodeMiddleware } from '../hono';
import { getRenderHandler } from '../../../plugins/render';

export const bindBffPlugin = (): ServerPlugin => ({
  name: '@modern-js/plugin-bind-bff',

  setup(api) {
    return {
      async prepare() {
        const config = api.useConfigContext();
        const prefix = config?.bff?.prefix || '/api';
        const enableHandleWeb = config?.bff?.enableHandleWeb;
        const httpMethodDecider = config?.bff?.httpMethodDecider;
        const runtimeEnv = getRuntimeEnv();

        if (runtimeEnv !== 'node') {
          return;
        }

        const { distDirectory: pwd, routes, middlewares } = api.useAppContext();

        const webOnly = await isWebOnly();

        let handler: ServerNodeMiddleware;

        if (webOnly) {
          handler = async (c, next) => {
            c.body('');
            await next();
          };
        } else {
          const runner = api.useHookRunners();
          const renderHandler = enableHandleWeb
            ? await getRenderHandler({
                pwd,
                routes: routes || [],
                config,
              })
            : null;
          handler = await runner.prepareApiServer(
            {
              pwd,
              prefix,
              render: renderHandler,
              httpMethodDecider,
            },
            { onLast: () => null as any },
          );
        }

        if (handler) {
          middlewares.push({
            name: 'bind-bff',
            handler: (c, next) => {
              if (!c.req.path.startsWith(prefix) && !enableHandleWeb) {
                return next();
              } else {
                return handler(c, next);
              }
            },
          });
        }
      },
    };
  },
});
