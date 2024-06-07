import { defineConfig, RenderMiddleware } from '@modern-js/app-tools/server';
import plugin1 from '../plugins/serverPlugin';

const timing: RenderMiddleware = async (c, next) => {
  const start = Date.now();

  await next();

  const end = Date.now();

  c.response.headers.set('server-timing', `render; dur=${end - start}`);
};

export default defineConfig({
  render: {
    middleware: [timing],
  },
  plugins: [plugin1()],
});
