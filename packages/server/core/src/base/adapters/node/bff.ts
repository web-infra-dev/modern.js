import { isWebOnly } from '@modern-js/utils';
import {
  BindRenderHandleOptions,
  getRenderHandler,
} from '../../../base/middlewares';
import { createMiddlewareCollecter, getRuntimeEnv } from '../../utils';
import { ServerBase, type ServerBaseOptions } from '../../serverBase';
import { ServerNodeMiddleware } from './hono';

export const bindBFFHandler = async (
  server: ServerBase,
  options: ServerBaseOptions & BindRenderHandleOptions,
) => {
  const prefix = options?.config?.bff?.prefix || '/api';
  const { enableHandleWeb } = options.config.bff;
  const { httpMethodDecider } = options.config.bff;
  const runtimeEnv = getRuntimeEnv();
  if (runtimeEnv !== 'node') {
    return;
  }
  const { getMiddlewares, ...collector } = createMiddlewareCollecter();
  const { runner } = server;
  await runner.gather(collector);

  const webOnly = await isWebOnly();
  let handler: ServerNodeMiddleware;
  if (webOnly) {
    handler = async (c, next) => {
      c.body('');
      await next();
    };
  } else {
    const renderHandler = enableHandleWeb
      ? await getRenderHandler(options)
      : null;
    handler = await server.runner.prepareApiServer(
      {
        pwd: options.pwd,
        prefix,
        render: renderHandler,
        httpMethodDecider,
      },
      { onLast: () => null as any },
    );
  }

  if (handler) {
    // In order to support bff.enableHandleWeb, this should be a global middleware
    server.all(`*`, (c, next) => {
      if (!c.req.path.startsWith(prefix) && !enableHandleWeb) {
        return next();
      } else {
        return handler(c, next);
      }
    });
  }
};
