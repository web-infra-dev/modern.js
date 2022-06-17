import {
  FieldDescriptors,
  SchemaCtorInput,
  toSchemaCtor,
  Struct,
  NonStrict,
} from 'farrow-schema';
import { MaybeAsync } from 'farrow-pipeline';
import {
  createSchemaValidator,
  Validator,
  ValidationError,
} from 'farrow-schema/validator';
import type { TypeOfRouterRequestField } from './types';

import {
  RequestSchema,
  TypeOfRequestSchema,
  PureTypeOfRequestSchema,
} from './request';
import {
  HandleResult,
  HandleSuccess,
  InputValidationError,
  OutputValidationError,
} from './response';

export type NormalHandler = (...args: any[]) => any;
export type Handler<I, O> = (input: I) => MaybeAsync<O>;

export type Schema<Req extends RequestSchema, Res extends SchemaCtorInput> = {
  request: Req;
  response: Res;
  description?: string;
  deprecated?: string;
};

const getErrorMessage = (error: ValidationError) => {
  let { message } = error;

  if (Array.isArray(error.path) && error.path.length > 0) {
    message = `path: ${JSON.stringify(error.path)}\n${message}`;
  }

  return message;
};

const HANDLER_WITH_SCHEMA = 'HANDLER_WITH_SCHEMA';

export type BaseSchemaHandler<
  Req extends RequestSchema,
  Res extends SchemaCtorInput,
> = ((
  input: TypeOfRequestSchema<Req>,
) => Promise<HandleResult<TypeOfRouterRequestField<Res>>>) & {
  schema: Schema<Req, Res>;
  [HANDLER_WITH_SCHEMA]: true;
};

export type SchemaHandler<
  Req extends RequestSchema,
  Res extends SchemaCtorInput,
> = ((
  input: TypeOfRequestSchema<Req>,
) => Promise<TypeOfRouterRequestField<Res>>) & {
  schema: Schema<Req, Res>;
  [HANDLER_WITH_SCHEMA]: true;
};

export const isSchemaHandler = (input: any): input is SchemaHandler<any, any> =>
  input && input?.[HANDLER_WITH_SCHEMA] === true;

export const isHandler = (input: any): input is Handler<any, any> =>
  input && typeof input === 'function';

export const baseMatch = <
  Req extends RequestSchema,
  Res extends SchemaCtorInput,
>(
  schema: Schema<Req, Res>,
  handler: Handler<TypeOfRequestSchema<Req>, TypeOfRouterRequestField<Res>>,
): BaseSchemaHandler<Req, Res> => {
  const validateApiInput = createRequestSchemaValidator(schema.request);

  const validateApiOutput = createSchemaValidator(
    toSchemaCtor(schema.response),
  );

  const handle = async (
    input: TypeOfRequestSchema<Req>,
  ): Promise<HandleResult<TypeOfRouterRequestField<Res>>> => {
    const inputResult = validateApiInput(input);
    if (inputResult.isErr) {
      return InputValidationError(getErrorMessage(inputResult.value));
    }

    const output = await handler(input);

    const outputResult = validateApiOutput(output);
    if (outputResult.isErr) {
      return OutputValidationError(getErrorMessage(outputResult.value));
    }

    return HandleSuccess(output);
  };

  return Object.assign(handle, {
    schema,
    [HANDLER_WITH_SCHEMA]: true as const,
  });
};

export const match: <Req extends RequestSchema, Res extends SchemaCtorInput>(
  schema: Schema<Req, Res>,
  handler: Handler<PureTypeOfRequestSchema<Req>, TypeOfRouterRequestField<Res>>,
) => SchemaHandler<Req, Res> = baseMatch as any;

const createRequestSchemaValidator = <T extends RequestSchema>(schema: T) => {
  const descriptors: FieldDescriptors = {};

  if (schema.params) {
    descriptors.params = schema.params;
  }

  if (schema.query) {
    descriptors.query = schema.query;
  }

  if (schema.data) {
    descriptors.data = schema.data;
  }

  if (schema.headers) {
    descriptors.headers = schema.headers;
  }

  if (schema.cookies) {
    descriptors.cookies = schema.cookies;
  }

  const RequestStruct = Struct(descriptors);

  return createSchemaValidator(NonStrict(RequestStruct) as any) as Validator<
    TypeOfRequestSchema<T>
  >;
};
