import { APIHandlerInfo } from '@modern-js/bff-core';
import Router from 'koa-router';
import { createRouteHandler } from './utils';

const registerRoutes = (router: Router, handlerInfos: APIHandlerInfo[]) => {
  handlerInfos.forEach(({ routePath, handler, httpMethod }) => {
    const routeHandler = createRouteHandler(handler);

    const method = httpMethod.toLowerCase();
    (router as any)[method](routePath, routeHandler);
  });
};

export default registerRoutes;
