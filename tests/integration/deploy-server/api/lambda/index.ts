import {
  Api,
  Data,
  Params,
  Post,
  Query,
  Headers,
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
  async ({ query, data, params, headers }) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const ctx = useContext();
    return {
      params,
      query,
      data,
      headers,
    };
  },
);
