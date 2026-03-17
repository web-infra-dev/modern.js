import {
  Api,
  Data,
  Headers,
  Params,
  Post,
  Query,
} from '@modern-js/plugin-bff/server';
import { useHonoContext } from '@modern-js/server-runtime';
import { z } from 'zod';

export default async () => ({
  message: 'Hello Modern.js get client',
});

export const post = async () => ({
  message: 'Hello Modern.js post client',
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
  async ({ query, data, params, headers }) => {
    const ctx = useHonoContext();
    return {
      params,
      query,
      data,
      headers,
    };
  },
);
