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
  Pipe,
  Middleware,
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
  Redirect('https://github.com/web-infra-dev/modern.js'),
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

export const postMiddleware = Api(
  Post('/middleware'),
  Middleware((req, res, next) => {
    next();
    res.json(req.body);
  }),
  () => {
    return 'hello';
  },
);

type PipeInput = {
  query: z.infer<typeof QuerySchema>;
  data: z.infer<typeof DataSchema>;
};

export const postPipe = Api(
  Post('/pipe'),
  Query(QuerySchema),
  Data(DataSchema),
  Pipe<PipeInput>(({ query, data }) => {
    return {
      query,
      data,
      headers: {
        'x-header': 'pipe',
      },
    };
  }),
  Pipe<PipeInput>((value, end) => {
    const { query, data } = value;
    const { user } = query;
    const { message } = data;
    if (user === 'end@github.com') {
      return end(data);
    }
    if (user === 'function@github.com') {
      if (message !== user) {
        return end(res => {
          res.status(400);
          return res.json({
            message: 'name and message must be modernjs',
          });
        });
      }
    }
    return value;
  }),
  input => {
    return input;
  },
);
