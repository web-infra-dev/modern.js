import {
  type MiddlewareHandler,
  defineServerConfig,
} from '@modern-js/server-runtime';

const headerMiddleware: MiddlewareHandler = async (c, next) => {
  c.header('x-index-middleware', 'true');
  await next();
};

const homeMiddleware: MiddlewareHandler = async (c, next) => {
  if (c.req.url.startsWith('/home')) {
    c.header('x-index-name', 'home');
  }
  await next();
};

const redirectMiddleware: MiddlewareHandler = async (c, next) => {
  if (c.req.url.startsWith('/redirect')) {
    c.header('Location', '/');
    c.status(302);
  }
  await next();
};

export default defineServerConfig({
  middlewares: [
    {
      name: 'header-middleware',
      handler: headerMiddleware,
    },
    {
      name: 'home-middleware',
      handler: homeMiddleware,
    },
    {
      name: 'redirect-middleware',
      handler: redirectMiddleware,
    },
  ],
});
