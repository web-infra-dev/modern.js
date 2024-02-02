import { isWebOnly } from '@modern-js/utils';
import { HttpMethodDecider } from '@modern-js/types';
import { createMiddlewareCollecter, getRuntimeEnv } from '../libs/utils';
import { ServerBase } from '../serverBase';
import { ServerNodeMiddleware } from '../types';

type BFFOptions = {
  pwd: string;
  prefix?: string;
  httpMethodDecider?: HttpMethodDecider;
};

export const bindBFFHandler = async (
  server: ServerBase,
  options: BFFOptions,
) => {
  const prefix = options?.prefix || '/api';
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
    handler = await server.runner.prepareApiServer(
      {
        pwd: options.pwd,
        prefix,
        httpMethodDecider: options.httpMethodDecider,
      },
      { onLast: () => null as any },
    );
  }

  server.all(`${prefix}/*`, handler);
};
