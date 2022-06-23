import { z } from 'zod';
import {
  Api,
  Data,
  Get,
  HttpCode,
  Post,
  Query,
  Redirect,
  Headers,
  SetHeaders,
} from '../../../../src/runtime';

const headers = {
  'x-header': 'x-header',
};
const statusCode = 201;

export const getHello = Api(
  Get('/hello'),
  HttpCode(statusCode),
  SetHeaders(headers),
  () => {
    return {
      message: 'hello',
    };
  },
);

export const getUser = Api(
  Get('/user'),
  Redirect('https://github.com/modern-js-dev/modern.js'),
  () => {
    return {
      message: 'hello',
    };
  },
);

const QuerySchema = z.object({
  user: z.string().email(),
});

const DataSchema = z.object({
  message: z.string(),
});

const HeadersSchema = z.object({
  'x-header': z.string(),
});

export const postUser = Api(
  Post('/user'),
  Query(QuerySchema),
  Data(DataSchema),
  Headers(HeadersSchema),
  async ({ query, data, headers }) => {
    return {
      query,
      data,
      headers,
    };
  },
);
