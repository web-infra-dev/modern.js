import {
  type MiddlewareHandler,
  defineServerConfig,
} from '@modern-js/server-runtime';

const timing: MiddlewareHandler = async (c, next) => {
  await next();

  const { res } = c;

  const text = await res.text();

  const newText = text.replace('<body>', '<body>bytedance');

  c.res = new Response(newText, {
    status: res.status,
    headers: res.headers,
  });
};

export default defineServerConfig({
  renderMiddlewares: [
    {
      name: 'render-timing',
      handler: timing,
    },
  ],
});
