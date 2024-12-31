import {
  Api,
  Data,
  Headers,
  Params,
  Post,
  Query,
  useContext,
} from '@modern-js/runtime/server';
import { COMMON_PREFIX } from '@shared/index';
import { z } from 'zod';

export default async () => {
  return {
    message: 'Hello get bff-api-app',
    prefix: COMMON_PREFIX,
  };
};

export const post = async () => {
  return {
    message: 'Hello post bff-api-app',
  };
};

const QuerySchema = z.object({
  user: z.string().email(),
});

const DataSchema = z.object({
  info: z.array(z.record(z.string(), z.union([z.string(), z.number()]))),
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
    const ctx = useContext();
    return {
      params,
      query,
      data,
      headers,
    };
  },
);
