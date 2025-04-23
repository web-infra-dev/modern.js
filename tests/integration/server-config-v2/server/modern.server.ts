import {
  type MiddlewareHandler,
  defineServerConfig,
} from '@modern-js/server-runtime';
import plugin1 from './plugins/serverPlugin';

const timing: MiddlewareHandler = async (c, next) => {
  const start = Date.now();

  await next();

  const end = Date.now();

  c.res.headers.set('server-timing', `render; dur=${end - start}`);
};

const requestTiming: MiddlewareHandler = async (c, next) => {
  const start = Date.now();

  await next();

  const end = Date.now();

  c.res.headers.set('x-middleware', `request; dur=${end - start}`);
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
  plugins: [plugin1()],
});
