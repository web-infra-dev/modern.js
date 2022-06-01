import { z } from 'zod';
import { HttpMetadata, Operator } from '../types';
import { ValidationError } from '../errors';

const validateInput = async <T>(schema: z.ZodType<T>, input: unknown) => {
  try {
    await schema.parseAsync(input);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new ValidationError(400, error.message);
    }
    throw error;
  }
};

// export const Get = (urlPath: string) => {
//   return {
//     name: 'get',
//     metadata({ setMetadata }){
//       setMetadata(HttpMetadata.Get, schema);
//     }
//   }
// }

export const Data = <T>(
  schema: z.ZodType<T>,
): Operator<{
  data: T;
}> => {
  return {
    name: HttpMetadata.Data,
    metadata({ setMetadata }) {
      setMetadata(HttpMetadata.Data, schema);
    },
    async validate(helper, next) {
      const { inputs } = helper;
      const { data } = inputs;
      await validateInput(schema, data);
      return next();
    },
  };
};

export const Query = <T>(
  schema: z.ZodType<T>,
): Operator<{
  query: T;
}> => {
  return {
    name: HttpMetadata.QUERY,
    metadata({ setMetadata }) {
      setMetadata(HttpMetadata.QUERY, schema);
    },
    async validate(helper, next) {
      const { inputs } = helper;
      const { query } = inputs;
      await validateInput(schema, query);
      return next();
    },
  };
};

export const Params = <T>(
  schema: z.ZodType<T>,
): Operator<{
  params: T;
}> => {
  return {
    name: HttpMetadata.PARAMS,
    metadata({ setMetadata }) {
      setMetadata(HttpMetadata.PARAMS, schema);
    },
    async validate(helper, next) {
      const { inputs } = helper;
      const { params } = inputs;
      await validateInput(schema, params);
      return next();
    },
  };
};
