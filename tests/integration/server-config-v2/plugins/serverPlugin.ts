import type { ServerPlugin } from '@modern-js/server-core';

export default (): ServerPlugin => ({
  name: 'serverPlugin1',
  setup() {
    return {
      config(serverConfig) {
        serverConfig.render ??= {};
        serverConfig.render.middleware ??= [];
        serverConfig.render.middleware.push(async (c, next) => {
          await next();

          const { response } = c;

          const text = await response.text();

          const newText = text.replace('<body>', '<body> <h3>bytedance</h3>');

          c.response = c.body(newText, {
            status: response.status,
            headers: response.headers,
          });
        });

        return serverConfig;
      },
    };
  },
});
