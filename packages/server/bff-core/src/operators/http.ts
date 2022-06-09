import { z } from 'zod';
import {
  HttpMetadata,
  Operator,
  OperatorType,
  HttpMethod,
  TriggerType,
  ApiMiddleware,
} from '../types';
import { ValidationError } from '../errors/http';

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

export const createHttpOperator = (method: HttpMethod) => {
  return (urlPath: string): Operator<void> => {
    return {
      name: method,
      metadata({ setMetadata }) {
        setMetadata(OperatorType.Trigger, {
          type: TriggerType.Http,
          path: urlPath,
          method,
        });
      },
    };
  };
};

export const Get = createHttpOperator(HttpMethod.Get);
export const Post = createHttpOperator(HttpMethod.Post);
export const Put = createHttpOperator(HttpMethod.Put);
export const Delete = createHttpOperator(HttpMethod.Delete);
export const Connect = createHttpOperator(HttpMethod.Connect);
export const Trace = createHttpOperator(HttpMethod.Trace);
export const Patch = createHttpOperator(HttpMethod.Patch);
export const Option = createHttpOperator(HttpMethod.Option);
export const Head = createHttpOperator(HttpMethod.Head);

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
    name: HttpMetadata.Query,
    metadata({ setMetadata }) {
      setMetadata(HttpMetadata.Query, schema);
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
    name: HttpMetadata.Params,
    metadata({ setMetadata }) {
      setMetadata(HttpMetadata.Params, schema);
    },
    async validate(helper, next) {
      const { inputs } = helper;
      const { params } = inputs;
      await validateInput(schema, params);
      return next();
    },
  };
};

export const Headers = <T>(
  schema: z.ZodType<T>,
): Operator<{
  headers: T;
}> => {
  return {
    name: HttpMetadata.Headers,
    metadata({ setMetadata }) {
      setMetadata(HttpMetadata.Headers, schema);
    },
    async validate(helper, next) {
      const { inputs } = helper;
      const { headers } = inputs;
      await validateInput(schema, headers);
      return next();
    },
  };
};

export const HttpCode = (statusCode: number): Operator<void> => {
  return {
    name: 'HttpCode',
    metadata({ setMetadata }) {
      setMetadata(HttpMetadata.StatusCode, statusCode);
    },
  };
};

export const SetHeaders = (headers: Record<string, string>): Operator<void> => {
  return {
    name: 'SetHeaders',
    metadata({ setMetadata }) {
      setMetadata(HttpMetadata.Headers, headers);
    },
  };
};

export const Redirect = (url: string): Operator<void> => {
  return {
    name: 'Redirect',
    metadata({ setMetadata }) {
      setMetadata(HttpMetadata.Redirect, url);
    },
  };
};

export const Middleware = (middleware: ApiMiddleware): Operator<void> => {
  return {
    name: 'Middleware',
    metadata({ setMetadata }) {
      setMetadata(OperatorType.Middleware, middleware);
    },
  };
};
