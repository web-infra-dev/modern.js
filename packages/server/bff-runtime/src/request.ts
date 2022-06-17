import {
  TypeOfFieldDescriptor,
  TypeOfFieldDescriptors,
  FieldDescriptor,
  FieldDescriptors,
} from 'farrow-schema';
import { MarkReadOnlyDeep, RouterSchemaDescriptor } from './types';

export type RequestBaseSchema = {
  params?: RouterSchemaDescriptor;
  query?: RouterSchemaDescriptor;
  headers?: RouterSchemaDescriptor;
  cookies?: RouterSchemaDescriptor;
};

export type RequestDataSchema = {
  data?: RouterSchemaDescriptor;
};

export type RequestBodyType = {
  body?: string;
};

export type PureRequestFormDataType = {
  formData?: Record<string, any>;
};
export type RequestFormDataType = {
  formData?: FormData;
};
export type RequestFormUrlencodedType = {
  // eslint-disable-next-line node/prefer-global/url-search-params,node/no-unsupported-features/node-builtins
  formUrlencoded?: URLSearchParams | Record<string, string> | string;
};
export type PureRequestFormUrlencodedType = {
  formUrlencoded?: Record<string, string>;
};

export type RequestExtraType = RequestBodyType &
  RequestFormDataType &
  RequestFormUrlencodedType;

export type PureRequestExtraType = RequestBodyType &
  PureRequestFormDataType &
  PureRequestFormUrlencodedType;

export type RequestSchema = RequestBaseSchema & RequestDataSchema;

export type TypeOfRequestField<T> = T extends string
  ? string
  : T extends FormData
  ? FormData
  : T extends FieldDescriptor
  ? TypeOfFieldDescriptor<T>
  : T extends FieldDescriptors
  ? TypeOfFieldDescriptors<T>
  : never;

export type TypeOfRequestDataSchema<T extends RequestDataSchema> =
  MarkReadOnlyDeep<
    T extends { data: any }
      ? Pick<
          {
            [key in keyof T]: TypeOfRequestField<T[key]>;
          },
          'data'
        >
      : RequestExtraType
  >;

export type TypeOfRequestSchema<T extends RequestSchema> = MarkReadOnlyDeep<
  Omit<
    {
      [key in keyof T]: TypeOfRequestField<T[key]>;
    },
    'data'
  > &
    TypeOfRequestDataSchema<T>
>;

export type PureTypeOfRequestDataSchema<T extends RequestDataSchema> =
  MarkReadOnlyDeep<
    T extends { data: any }
      ? Pick<
          {
            [key in keyof T]: TypeOfRequestField<T[key]>;
          },
          'data'
        >
      : PureRequestExtraType
  >;

export type PureTypeOfRequestSchema<T extends RequestSchema> = MarkReadOnlyDeep<
  Omit<
    {
      [key in keyof T]: TypeOfRequestField<T[key]>;
    },
    'data'
  > &
    PureTypeOfRequestDataSchema<T>
>;

export type InputType = TypeOfRequestSchema<RequestSchema>;
