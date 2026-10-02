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
} from '@modern-js/plugin-bff/server';
import { useHonoContext } from '@modern-js/server-runtime';
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
  ext: z.array(z.object({ from: z.string() })),
  arr: z.array(z.string()),
  obj: z.object({
    a: z.string(),
  }),
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

const GetQuerySchema = z.object({
  user: z.string().email(),
});

export const getHello = Api(
  Get('/hello/get'),
  Query(GetQuerySchema),
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

export const getImage = Api(Get('/hello/image'), async () => {
  const validBase64 =
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAFCAYAAACNbyblAAAAHElEQVQI12P4//8/w38GIAXDIBKE0DHxgljNBAAO9TXL0Y4OHwAAAABJRU5ErkJggg==';
  const base64Data = validBase64.split(',')[1];
  const binaryString = atob(base64Data);
  const uint8Array = new Uint8Array(binaryString.length);

  for (let i = 0; i < binaryString.length; i++) {
    uint8Array[i] = binaryString.charCodeAt(i);
  }

  return new Response(uint8Array.buffer, {
    status: 200,
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'no-store',
    },
  });
});
