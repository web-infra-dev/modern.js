import { defineServerConfig } from '@modern-js/server-runtime';
import { greeting } from '@shared/greeting';

export default defineServerConfig({
  middlewares: [
    {
      name: 'x-greeting',
      handler: async (c, next) => {
        await next();
        c.res.headers.set('x-greeting', greeting('server'));
      },
    },
  ],
});
