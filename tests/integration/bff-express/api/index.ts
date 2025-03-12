import {
  Api,
  Data,
  Headers,
  Middleware,
  Params,
  Post,
  Query,
  useContext,
} from '@modern-js/runtime/server';
import { z } from 'zod';

export default async () => ({
  message: 'Hello Modern.js',
});

export const post = async () => ({
  message: 'Hello Modern.js',
});

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
  Middleware(async (req, res, next) => {
    console.info(`express Middleware access url: ${req.url}`);
    await next();
  }),
  async ({ query, data, params, headers }) => {
    const ctx = useContext();
    return {
      params,
      query,
      data,
      headers,
    };
  },
);
