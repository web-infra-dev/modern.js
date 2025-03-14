import { defineConfig } from '@modern-js/app-tools/server';
import type { Middleware } from '@modern-js/server-core';
import plugin1 from '../plugins/serverPlugin';

const timing: Middleware = async (c, next) => {
  const start = Date.now();

  console.log('render timing', start);

  await next();

  const end = Date.now();

  console.log('render timing', end);
};

const requestTiming: Middleware = async (c, next) => {
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
