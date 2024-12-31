// import type { Merge } from 'type-fest';
type Merge<T, U> = T & Omit<U, keyof T>;

export enum OperatorType {
  Trigger = 0,
  Middleware = 1,
}

export enum TriggerType {
  Http = 0,
}

export enum HttpMetadata {
  Method = 'METHOD',
  Data = 'DATA',
  Query = 'QUERY',
  Params = 'PARAMS',
  Headers = 'HEADERS',
  Response = 'RESPONSE',
  Files = 'Files',
}

export enum ResponseMetaType {
  StatusCode = 0,
  Redirect = 1,
  Headers = 2,
}

export enum HttpMethod {
  Get = 'GET',
  Post = 'POST',
  Put = 'PUT',
  Delete = 'DELETE',
  Connect = 'CONNECT',
  Trace = 'TRACE',
  Patch = 'PATCH',
  Options = 'OPTIONS',
  Head = 'HEAD',
}

export type InputSchemaMeata = Extract<
  HttpMetadata,
  | HttpMetadata.Data
  | HttpMetadata.Query
  | HttpMetadata.Headers
  | HttpMetadata.Params
  | HttpMetadata.Files
>;

export type ExecuteFunc<Outputs> = (
  helper: ExecuteHelper<Outputs>,
  next: () => Promise<any>,
) => Promise<any>;

export type ExecuteHelper<Outputs> = {
  result?: any;
  inputs: Outputs;
};

export type MetadataHelper = {
  setMetadata: <T = any>(key: any, value: T) => void;
  getMetadata: <T = any>(key: any) => T;
};

export type Operator<Input = any, Output = Input> = {
  name: string;
  inputType?: Input;
  outputType?: Output;
  metadata?: (helper: MetadataHelper) => void;
  validate?: ExecuteFunc<Output>;
  execute?: ExecuteFunc<Output>;
};

export type MaybeAsync<T> = Promise<T> | T;

export type ApiRunner<
  Input extends object | void | unknown,
  Output extends MaybeAsync<any>,
> = (...args: Input extends void ? [] : [input: Input]) => Output;

export type NonNullable<T> = Exclude<T, null | undefined>;

export type ExtractInputType<T> = {
  [key in keyof T]: T[key] extends Operator<any, any>
    ? NonNullable<T[key]['inputType']>
    : void;
};

export type ExtractOuputType<T> = {
  [key in keyof T]: T[key] extends Operator<any, any>
    ? NonNullable<T[key]['outputType']>
    : void;
};

// fork from https://github.com/midwayjs/hooks/blob/main/packages/hooks-core/src/api/type.ts
// license at https://github.com/midwayjs/hooks/blob/main/LICENSE
export type ArrayToObject<T, R = {}> = T extends [infer First, ...infer Rest]
  ? First extends PromiseLike<infer PromiseValue>
    ? PromiseValue
    : First extends object
      ? Merge<First, ArrayToObject<Rest, R>>
      : ArrayToObject<Rest, R>
  : R;

export type AsyncFunction = (...args: any[]) => Promise<any>;

export const httpMethods = Object.values(HttpMethod);
