import 'reflect-metadata';
import type { APIHandlerInfo } from '@modern-js/bff-core';
import type { Express, RequestHandler } from 'express';
import { createRouteHandler } from './utils';

const registerRoutes = (app: Express, handlerInfos: APIHandlerInfo[]) => {
  handlerInfos.forEach(({ routePath, handler, httpMethod }) => {
    const routeHandler: RequestHandler = createRouteHandler(handler);

    const method = httpMethod.toLowerCase();
    (app as any)[method](routePath, routeHandler);
  });
};

export default registerRoutes;
