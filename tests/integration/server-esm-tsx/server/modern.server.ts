import { defineServerConfig } from '@modern-js/server-runtime';
import { message } from '../shared/message';
// Extension-less directory import, resolved to `./foo/index.tsx`.
import { badgeName } from './foo';

export default defineServerConfig({
  middlewares: [
    {
      name: 'esm-tsx-probe',
      handler: async (c, next) => {
        await next();
        c.res.headers.set('x-esm-tsx', `${badgeName}-${message}`);
      },
    },
  ],
});
