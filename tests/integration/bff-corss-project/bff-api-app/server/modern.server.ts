import {
  type MiddlewareHandler,
  defineServerConfig,
} from '@modern-js/server-runtime';
import { cors } from 'hono/cors';

const corsMiddleware: MiddlewareHandler = async (c, next) => {
  const corsMiddlewareHandler = cors({
    origin: '*',
  });
  return corsMiddlewareHandler(c, next);
};

export default defineServerConfig({
  middlewares: [
    {
      name: 'cors',
      handler: corsMiddleware,
    },
  ],
});
