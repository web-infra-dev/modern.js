import * as Schema from 'farrow-schema';

type Path = string | RegExp | Array<string | RegExp>;

export type TypeOfRouterRequestField<T> = T extends string | string[]
  ? string
  : T extends Path
  ? string
  : T extends Schema.FieldDescriptor
  ? Schema.TypeOfFieldDescriptor<T>
  : T extends Schema.FieldDescriptors
  ? Schema.TypeOfFieldDescriptors<T>
  : never;

export type RouterSchemaDescriptor =
  | Schema.FieldDescriptors
  | (new () => Schema.ObjectType)
  | (new () => Schema.StructType);

// eslint-disable-next-line @typescript-eslint/ban-types
export type MarkReadOnlyDeep<T> = T extends {} | any[]
  ? {
      readonly [key in keyof T]: MarkReadOnlyDeep<T[key]>;
    }
  : T;
