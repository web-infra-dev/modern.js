import { ValidationError } from '../errors/http';
import {
  HttpMetadata,
  HttpMethod,
  type MetadataHelper,
  type Operator,
  OperatorType,
  ResponseMetaType,
  TriggerType,
} from '../types';
import type {
  InferSchemaInput,
  InferSchemaOutput,
  StandardSchemaV1,
  ValidationSchema,
} from './standardSchema';

export interface ResponseMeta {
  type: ResponseMetaType;
  value: unknown;
}

const validateInput = async <Schema extends ValidationSchema>(
  schema: Schema,
  input: unknown,
): Promise<InferSchemaOutput<Schema>> => {
  // Zod schemas keep using their own parser, so transforms, async refinements
  // and error messages stay the same as before.
  if (typeof (schema as any).parseAsync === 'function') {
    try {
      return await (schema as any).parseAsync(input);
    } catch (error: any) {
      if ('name' in error && error.name === 'ZodError') {
        throw new ValidationError(400, error.message);
      }
      throw error;
    }
  }

  const result = await (schema as StandardSchemaV1)['~standard'].validate(
    input,
  );
  if (result.issues) {
    throw new ValidationError(400, JSON.stringify(result.issues, null, 2));
  }
  return result.value as InferSchemaOutput<Schema>;
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
export const Options = createHttpOperator(HttpMethod.Options);
export const Head = createHttpOperator(HttpMethod.Head);

export const Data = <Schema extends ValidationSchema>(
  schema: Schema,
): Operator<
  {
    data: InferSchemaInput<Schema>;
  },
  {
    data: InferSchemaOutput<Schema>;
  }
> => {
  return {
    name: HttpMetadata.Data,
    metadata({ setMetadata }) {
      setMetadata(HttpMetadata.Data, schema);
    },
    async validate(helper, next) {
      const {
        inputs: { data },
      } = helper;

      helper.inputs = {
        ...helper.inputs,
        data: await validateInput(schema, data),
      };
      return next();
    },
  };
};

export const Query = <Schema extends ValidationSchema>(
  schema: Schema,
): Operator<
  {
    query: InferSchemaInput<Schema>;
  },
  {
    query: InferSchemaOutput<Schema>;
  }
> => {
  return {
    name: HttpMetadata.Query,
    metadata({ setMetadata }) {
      setMetadata(HttpMetadata.Query, schema);
    },
    async validate(helper, next) {
      const {
        inputs: { query },
      } = helper;

      helper.inputs = {
        ...helper.inputs,
        query: await validateInput(schema, query),
      };
      return next();
    },
  };
};

export const Params = <Schema extends ValidationSchema>(
  schema: Schema,
): Operator<
  {
    params: InferSchemaInput<Schema>;
  },
  {
    params: InferSchemaOutput<Schema>;
  }
> => {
  return {
    name: HttpMetadata.Params,
    metadata({ setMetadata }) {
      setMetadata(HttpMetadata.Params, schema);
    },
    async validate(helper, next) {
      const {
        inputs: { params },
      } = helper;

      helper.inputs = {
        ...helper.inputs,
        params: await validateInput(schema, params),
      };
      return next();
    },
  };
};

export const Headers = <Schema extends ValidationSchema>(
  schema: Schema,
): Operator<
  {
    headers: InferSchemaInput<Schema>;
  },
  {
    headers: InferSchemaOutput<Schema>;
  }
> => {
  return {
    name: HttpMetadata.Headers,
    metadata({ setMetadata }) {
      setMetadata(HttpMetadata.Headers, schema);
    },
    async validate(helper, next) {
      const {
        inputs: { headers },
      } = helper;

      helper.inputs = {
        ...helper.inputs,
        headers: await validateInput(schema, headers),
      };
      return next();
    },
  };
};

const setResponseMeta = (
  helper: MetadataHelper,
  type: ResponseMetaType,
  value: ResponseMeta['value'],
) => {
  const responseMetaData =
    helper.getMetadata<ResponseMeta[]>(HttpMetadata.Response) || [];

  helper.setMetadata(HttpMetadata.Response, [
    ...responseMetaData,
    {
      type,
      value,
    },
  ]);
};

export const HttpCode = (statusCode: number): Operator<void> => {
  return {
    name: 'HttpCode',
    metadata(helper) {
      setResponseMeta(helper, ResponseMetaType.StatusCode, statusCode);
    },
  };
};

export const SetHeaders = (headers: Record<string, string>): Operator<void> => {
  return {
    name: 'SetHeaders',
    metadata(helper) {
      setResponseMeta(helper, ResponseMetaType.Headers, headers);
    },
  };
};

export const Redirect = (url: string): Operator<void> => {
  return {
    name: 'Redirect',
    metadata(helper) {
      setResponseMeta(helper, ResponseMetaType.Redirect, url);
    },
  };
};

export const Upload = <Schema extends ValidationSchema>(
  urlPath: string,
  schema?: Schema,
): Operator<
  {
    files: InferSchemaInput<Schema>;
  },
  {
    formData: InferSchemaOutput<Schema>;
  }
> => {
  return {
    name: 'Upload',
    metadata({ setMetadata }) {
      setMetadata(OperatorType.Trigger, {
        type: TriggerType.Http,
        path: urlPath,
        method: HttpMethod.Post,
        action: 'upload',
      });
      setMetadata(HttpMetadata.Files, schema);
    },
    async validate(helper, next) {
      if (!schema) {
        return next();
      }

      const {
        inputs: { formData: files },
      } = helper;

      (helper.inputs as any) = {
        ...helper.inputs,
        files: await validateInput(schema, files),
      };
      return next();
    },
  };
};
