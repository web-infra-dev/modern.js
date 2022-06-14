import { z } from 'zod';
import {
  Api,
  Data,
  Get,
  Query,
  HttpCode,
  ValidationError,
  HttpMetadata,
  SetHeaders,
  Redirect,
} from '../../src';

describe('test api function', () => {
  test('should works correctly', async () => {
    const DataSchema = z.object({
      stars: z.number(),
      email: z.string().email(),
    });
    const QuerySchema = z.object({
      name: z.string().min(3).max(10),
    });
    const handler = Api(
      Get('/api'),
      Query(QuerySchema),
      Data(DataSchema),
      async ({ query, data }) => {
        return {
          query,
          data,
        };
      },
    );

    expect(typeof handler).toBe('function');

    const expectedQuery = {
      name: 'Modernjs',
    };
    const expectedData = {
      stars: 100000,
      email: 'modernjs@github.com',
    };
    const res = await handler({
      query: expectedQuery,
      data: expectedData,
    });

    const { query, data } = res;
    expect(query).toEqual(expectedQuery);
    expect(data).toEqual(expectedData);
  });

  test('should throw expected error', async () => {
    const DataSchema = z.object({
      stars: z.number(),
      email: z.string().email(),
    });

    const handler = Api(Data(DataSchema), async ({ data }) => {
      return {
        data,
      };
    });

    await expect(
      handler({
        data: {
          stars: 14,
          email: 'Modernjs',
        },
      }),
    ).rejects.toThrow(ValidationError);
  });

  test('should set response metadata correctly', async () => {
    const expectedStatusCode = 204;
    const expectedUrl = 'https://github.com/modern-js-dev/modern.js';
    const expectedHeaders = {
      'x-header': 'x-header',
    };
    const handler = Api(
      HttpCode(expectedStatusCode),
      SetHeaders(expectedHeaders),
      Redirect(expectedUrl),
      () => {
        return 'Hello Modern.js';
      },
    );

    const httpCode = Reflect.getMetadata(HttpMetadata.StatusCode, handler);
    const headers = Reflect.getMetadata(HttpMetadata.ResponseHeaders, handler);
    const url = Reflect.getMetadata(HttpMetadata.Redirect, handler);

    expect(httpCode).toBe(expectedStatusCode);
    expect(headers).toEqual(expectedHeaders);
    expect(url).toBe(expectedUrl);
  });
});
