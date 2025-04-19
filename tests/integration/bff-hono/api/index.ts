import {
  Api,
  Data,
  Get,
  Headers,
  Middleware,
  Params,
  Pipe,
  Post,
  Query,
  useHonoContext,
} from '@modern-js/plugin-bff/hono';
import { z } from 'zod';

export default async () => {
  return {
    message: 'Hello Modern.js',
  };
};

export const post = async ({ formUrlencoded }: { formUrlencoded: any }) => {
  return {
    message: 'formUrlencoded data',
    formUrlencoded,
  };
};

const QuerySchema = z.object({
  user: z.string().email(),
});

const DataSchema = z.object({
  message: z.string(),
});

const ParamsSchema = z.object({
  id: z.string(),
});

const HeadersSchema = z.object({
  'x-header': z.string(),
});

export const postHello = Api(
  Post('/hello/:id'),
  Params(ParamsSchema),
  Query(QuerySchema),
  Data(DataSchema),
  Headers(HeadersSchema),
  Middleware(async (c, next) => {
    c.res.headers.set('x-bff-fn-middleware', '1');
    await next();
  }),
  Pipe<{
    params: z.infer<typeof ParamsSchema>;
    query: z.infer<typeof QuerySchema>;
    data: z.infer<typeof DataSchema>;
    headers: z.infer<typeof HeadersSchema>;
  }>(input => {
    const { data } = input;
    if (!data.message.startsWith('msg: ')) {
      data.message = `msg: ${data.message}`;
    }
    return input;
  }),
  async ({ query, data, params, headers }) => {
    const c = useHonoContext();
    c.res.headers.set('x-bff-api', c.req.path);
    return {
      path: c.req.path,
      params,
      query,
      data,
      headers,
    };
  },
);

export const getHello = Api(
  Get('/hello/get'),
  Query(QuerySchema),
  async ({ query }) => {
    try {
      const c = useHonoContext();
      c.res.headers.set('x-bff-api', c.req.path);
    } catch (error) {
      return {
        query: 0,
      };
    }
    return {
      query,
    };
  },
);
