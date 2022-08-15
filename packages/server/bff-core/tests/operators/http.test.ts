import { z } from 'zod';
import {
  Api,
  Data,
  Get,
  Query,
  HttpCode,
  ValidationError,
  SetHeaders,
  Redirect,
  ResponseMetaType,
  HttpMetadata,
} from '../../src';

type Assert<T1, T2> = T1 extends T2 ? (T2 extends T1 ? true : false) : false;

type Expect<T extends true> = T;

describe('test api function', () => {
  test('should works correctly', async () => {
    const DataSchema = z.object({
      stars: z.number(),
      email: z.string().email(),
      stringToNumber: z
        .string()
        .transform(val => z.number().min(10).parse(Number(val))),
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
    const inputData = {
      stars: 100000,
      email: 'modernjs@github.com',
      stringToNumber: '100',
    };
    const outputsExpectedData = {
      stars: 100000,
      email: 'modernjs@github.com',
      stringToNumber: 100,
    };

    const res = await handler({
      query: expectedQuery,
      data: inputData,
    });

    const { query, data } = res;

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    type Case = Expect<Assert<typeof data, typeof outputsExpectedData>>;

    expect(query).toEqual(expectedQuery);
    expect(data).toEqual(outputsExpectedData);
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

  test('should support transform', async () => {
    const DataSchema = z.object({
      stars: z.string().transform(val =>
        z
          .object({
            test: z.number(),
          })
          .parse(JSON.parse(val)),
      ),
    });

    const handler = Api(Data(DataSchema), async ({ data }) => {
      return {
        data,
      };
    });

    const result = await handler({
      data: {
        stars: JSON.stringify({ test: 1 }),
      },
    });

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    type Case = Expect<Assert<z.input<typeof DataSchema>, { stars: string }>>;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    type Case2 = Expect<
      Assert<z.output<typeof DataSchema>, { stars: { test: number } }>
    >;

    expect(result).toEqual({ data: { stars: { test: 1 } } });

    await expect(
      handler({
        data: {
          stars: 14 as any,
        },
      }),
    ).rejects.toThrow(ValidationError);
  });

  test('should support lazy', async () => {
    // 支持lazy

    interface CircularDataSchemaData {
      name: string;
      children?: CircularDataSchemaData[];
    }

    const CircularDataSchema: z.ZodType<CircularDataSchemaData> = z.object({
      name: z.string(),
      children: z.array(z.lazy(() => CircularDataSchema)).optional(),
    });

    const getResponse = Api(
      Get('/api'),
      Data(CircularDataSchema),
      async ({ data }) => {
        return {
          data,
        };
      },
    );

    const reqData = {
      data: {
        name: '123',
        children: [
          {
            name: '456',
          },
        ],
      },
    };

    const response = await getResponse(reqData);
    expect(response.data).toEqual(reqData.data);

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    type Case2 = Expect<Assert<typeof response.data, CircularDataSchemaData>>;
  });

  test('should support records', async () => {
    const DataSchema = z.record(z.string(), z.number());

    const handler = Api(Data(DataSchema), async ({ data }) => {
      return {
        data,
      };
    });

    const result = await handler({
      data: {
        stars: 2,
      },
    });

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    type Case2 = Expect<
      Assert<z.infer<typeof DataSchema>, Record<string, number>>
    >;

    expect(result).toEqual({ data: { stars: 2 } });

    await expect(
      handler({
        data: {
          stars: '123' as any,
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

    const responseMeta = Reflect.getMetadata(HttpMetadata.Response, handler);
    expect(responseMeta).toHaveLength(3);

    const responseMetaTypes = responseMeta.map(
      (meta: { type: ResponseMetaType; value: unknown }) => meta.type,
    );

    expect(responseMetaTypes).toEqual([
      ResponseMetaType.StatusCode,
      ResponseMetaType.Headers,
      ResponseMetaType.Redirect,
    ]);
  });
});
