import { z as z4 } from 'zod';
import { z as z3 } from 'zod/v3';
import {
  Api,
  Data,
  Headers,
  Params,
  Query,
  type StandardSchemaV1,
  Upload,
  ValidationError,
} from '../../src';

type Assert<T1, T2> = T1 extends T2 ? (T2 extends T1 ? true : false) : false;

type Expect<T extends true> = T;

// bff-core resolves Zod 4 in this repo, so the Zod 3 cases cover apps whose
// own `zod` differs from the copy linked next to bff-core.
describe.each([
  ['zod 3', z3],
  ['zod 4', z4],
] as const)('operators with %s schemas', (_, z) => {
  test.each([
    ['data', Data],
    ['query', Query],
    ['params', Params],
    ['headers', Headers],
  ] as const)(
    'should validate and transform %s input',
    async (key, operator) => {
      const schema = (z as typeof z4).object({
        value: (z as typeof z4).string().transform(value => Number(value)),
      });
      const handler = Api(operator(schema), inputs => inputs);

      expect(await handler({ [key]: { value: '42' } } as any)).toEqual({
        [key]: { value: 42 },
      });
      await expect(handler({ [key]: { value: 42 } } as any)).rejects.toThrow(
        ValidationError,
      );
    },
  );
});

describe('operator types', () => {
  test('should infer input and output types from zod 3 schemas', async () => {
    const DataSchema = z3.object({
      count: z3.string().transform(value => Number(value)),
    });
    const QuerySchema = z3.object({ id: z3.string() });
    const UploadSchema = z3.object({
      images: z3.record(z3.string(), z3.any()),
    });

    const handler = Api(
      Data(DataSchema),
      Query(QuerySchema),
      async ({ data, query }) => {
        type DataCase = Expect<Assert<typeof data, { count: number }>>;
        type QueryCase = Expect<Assert<typeof query, { id: string }>>;
        return { data, query };
      },
    );
    const upload = Api(
      Upload('/upload', UploadSchema),
      async ({ formData }) => {
        type UploadCase = Expect<
          Assert<typeof formData, { images: Record<string, any> }>
        >;
        return formData;
      },
    );
    expect(typeof upload).toBe('function');

    type Input = Parameters<typeof handler>[0];
    type InputCase = Expect<
      Assert<Input['data'], { count: string }> &
        Assert<Input['query'], { id: string }>
    >;

    expect(
      await handler({ data: { count: '1' }, query: { id: 'a' } } as any),
    ).toEqual({ data: { count: 1 }, query: { id: 'a' } });
  });

  test('should infer input and output types from zod 4 schemas', async () => {
    const DataSchema = z4.object({
      count: z4.string().transform(value => Number(value)),
    });

    const handler = Api(Data(DataSchema), async ({ data }) => {
      type DataCase = Expect<Assert<typeof data, { count: number }>>;
      return data;
    });

    type Input = Parameters<typeof handler>[0];
    type InputCase = Expect<Assert<Input['data'], { count: string }>>;

    expect(await handler({ data: { count: '1' } })).toEqual({ count: 1 });
  });
});

describe('non-zod standard schemas', () => {
  const NumberSchema: StandardSchemaV1<string, number> = {
    '~standard': {
      version: 1,
      vendor: 'test',
      validate: value =>
        typeof value === 'string'
          ? { value: Number(value) }
          : { issues: [{ message: 'Expected string' }] },
    },
  };

  test('should validate through ~standard.validate', async () => {
    const handler = Api(Data(NumberSchema), async ({ data }) => {
      type DataCase = Expect<Assert<typeof data, number>>;
      return data;
    });

    expect(await handler({ data: '42' })).toBe(42);
    await expect(handler({ data: 42 as any })).rejects.toThrow(ValidationError);
    await expect(handler({ data: 42 as any })).rejects.toThrow(
      'Expected string',
    );
  });
});

describe('zod schemas without standard schema support', () => {
  // Zod < 3.24 schemas only expose `_input`, `_output` and `parseAsync`.
  const LegacySchema = {
    _input: '' as string,
    _output: 0 as number,
    parseAsync: async (value: unknown) => Number(value),
  };

  test('should infer types from _input and _output', async () => {
    const handler = Api(Data(LegacySchema), async ({ data }) => {
      type DataCase = Expect<Assert<typeof data, number>>;
      return data;
    });

    type Input = Parameters<typeof handler>[0];
    type InputCase = Expect<Assert<Input['data'], string>>;

    expect(await handler({ data: '42' })).toBe(42);
  });
});
