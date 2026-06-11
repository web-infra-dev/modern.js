import {
  Api,
  Get,
  Query,
  useHonoContext,
} from '@modern-js/plugin-bff/hono';
import { z } from 'zod';

export default async () => {
  return {
    message: 'Hello Modern.js',
  };
};

const GetQuerySchema = z.object({
  user: z.string().email(),
});

export const getHello = Api(
  Get('/hello/get'),
  Query(GetQuerySchema),
  async ({ query }) => {
    const c = useHonoContext();
    c.res.headers.set('x-bff-api', c.req.path);
    return { query };
  },
);
