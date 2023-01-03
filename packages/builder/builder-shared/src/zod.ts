import { z, ZodTypeAny, ZodRawShape } from 'zod';
import { ChainedConfig, JSONPrimitive, JSONValue } from './types';

export function arrayOrNot<T extends ZodTypeAny>(schema: T) {
  return z.union([z.array(schema), schema]);
}

export function chained<Config, Utils = unknown>(
  config: z.ZodType<Config>,
  utils?: z.ZodType<Utils>,
): z.ZodType<ChainedConfig<Config, Utils>> {
  const ret = z.union([config, z.void()]);
  const fn = utils
    ? z.function(z.tuple([config, utils]), ret)
    : z.function(z.tuple([config]), ret);
  const combined = z.union([config, fn]);
  return arrayOrNot(combined) as any;
}

export const primitive = () => {
  const literalSchema: z.ZodType<JSONPrimitive> = z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.null(),
  ]);
  return literalSchema;
};

export const json = () => {
  const jsonSchema: z.ZodType<JSONValue> = z.lazy(() =>
    z.union([primitive(), z.array(jsonSchema), z.record(jsonSchema)]),
  );
  return jsonSchema;
};

export const partialObj = <T extends ZodRawShape>(src: T) => {
  return z.object(src).partial();
};

export const anyFunction = (): z.ZodFunction<any, any> => z.function();

export type Literal = string | number | boolean | null | undefined;

export const unionLiterals = <T extends Literal[]>(
  literals: [...T],
): z.ZodType<T[number]> => {
  const wraps = literals.map(value => z.literal(value));
  return z.union(wraps as any);
};

export const literals = unionLiterals;

export * from 'zod';
export * from 'zod-validation-error';
