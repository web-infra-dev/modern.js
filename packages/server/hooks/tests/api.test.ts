import { z } from 'zod';
import { Api, Data } from '../src';
import { ValidationError } from '../src/errors';
import { Query } from '../src/operators/http';

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
});
