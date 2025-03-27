import { defineConfig } from '@modern-js/app-tools/server';
import type { MiddlewareHandler } from '@modern-js/runtime/server';
import plugin1 from '../plugins/serverPlugin';

const timing: MiddlewareHandler = async (c, next) => {
  const start = Date.now();

  console.log('render timing', start);

  await next();

  const end = Date.now();

  c.res.headers.set('server-timing', `render; dur=${end - start}`);
  console.log('render timing', end);
};

const requestTiming: MiddlewareHandler = async (c, next) => {
  const start = Date.now();

  console.log('request timing', start);

  await next();

  const end = Date.now();

  console.log('request timing', end);
};

export default defineConfig({
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
