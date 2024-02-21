import { isWebOnly } from '@modern-js/utils';
import {
  BindRenderHandleOptions,
  getRenderHandler,
} from '@base/middlewares/renderHandler';
import type { ServerBaseOptions } from '@core/server';
import { createMiddlewareCollecter, getRuntimeEnv } from '../../libs/utils';
import { ServerBase } from '../../serverBase';
import { ServerNodeMiddleware } from './hono';

export const bindBFFHandler = async (
  server: ServerBase,
  options: ServerBaseOptions & BindRenderHandleOptions,
) => {
  const prefix = options.config.bff.prefix || '/api';
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
  const renderHandler = getRenderHandler(options);
  if (webOnly) {
    handler = async (c, next) => {
      c.body('');
      await next();
    };
  } else {
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

  server.all(`${prefix}/*`, handler);
};
