import {
  type MiddlewareHandler,
  defineServerConfig,
} from '@modern-js/server-runtime';
import { value } from '@shared/repro';
import plugin1 from './plugins/serverPlugin';

const timing: MiddlewareHandler = async (c, next) => {
  const start = Date.now();
  const auth = c.req.query('auth');
  if (auth) {
    return c.redirect('/login');
  }
  await next();

  const end = Date.now();

  c.res.headers.set('server-timing', `render; dur=${end - start}`);
};

const requestTiming: MiddlewareHandler = async (c, next) => {
  const start = Date.now();

  await next();

  const end = Date.now();
  const message = c.get('message');

  c.res.headers.set('x-middleware', `request; dur=${end - start}`);
  c.res.headers.set('x-message', message);
};

export default defineServerConfig({
  middlewares: [
    {
      name: 'set-message',
      handler: async (c, next) => {
        c.set('message', value || 'hi');
        await next();
      },
    },
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
