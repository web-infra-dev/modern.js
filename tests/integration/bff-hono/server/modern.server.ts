import {
  type MiddlewareHandler,
  defineServerConfig,
  useHonoContext,
} from '@modern-js/server-runtime';

const timing: MiddlewareHandler = async (c, next) => {
  const ctx = useHonoContext();

  const start = Date.now();

  await next();

  const end = Date.now();

  c.res.headers.set(
    'x-render-middleware',
    `dur=${end - start}; path=${ctx.req.path}`,
  );
};

const requestTiming: MiddlewareHandler = async (c, next) => {
  const start = Date.now();

  await next();

  const end = Date.now();

  c.res.headers.set('x-middleware', `dur=${end - start}`);
};

export default defineServerConfig({
  middlewares: [
    {
      name: 'request-timing',
      handler: requestTiming,
    },
  ],
  renderMiddlewares: [
    {
      name: 'render-timing',
      handler: timing,
    },
  ],
});
