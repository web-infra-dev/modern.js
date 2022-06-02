import { Merge } from 'type-fest';

export enum OperatorType {
  Trigger,
}

export enum TriggerType {
  Http,
}

export enum HttpMetadata {
  Method = 'METHOD',
  Data = 'DATA',
  Query = 'QUERY',
  Params = 'PARAMS',
  Headers = 'HEADERS',
  Response = 'RESPONSE',
}

export enum HttpMethod {
  Get = 'GET',
  Post = 'POST',
  Put = 'PUT',
  Delete = 'DELETE',
  Connect = 'CONNECT',
  Trace = 'TRACE',
  Patch = 'PATCH',
  Option = 'OPTION',
  Head = 'HEAD',
}

export type InputSchemaMeata = Extract<
  HttpMetadata,
  | HttpMetadata.Data
  | HttpMetadata.Query
  | HttpMetadata.Headers
  | HttpMetadata.Params
>;

export type ValidateFunc = (
  helper: ExecuteHelper,
  next: () => Promise<any>,
) => Promise<any>;

export type ExecuteHelper = {
  result?: any;
  readonly inputs: any;
};

export type MetadataHelper = {
  setMetadata: <T = any>(key: any, value: T) => void;
  getMetadata: <T = any>(key: any) => T;
};

export type Operator<Input> = {
  name: string;
  inputType?: Input;
  metadata?: (helper: MetadataHelper) => void;
  validate?: ValidateFunc;
};

export type ApiRunner<
  Input extends object | void | unknown,
  Res extends Promise<any>,
> = (
  ...args: Input extends void ? Record<string, unknown> : [input: Input]
) => Res;

export type ExtractInputType<T> = {
  [key in keyof T]: T[key] extends Operator<any> ? T[key]['inputType'] : void;
};

// eslint-disable-next-line @typescript-eslint/ban-types
export type ArrayToObject<T, R = {}> = T extends [infer First, ...infer Rest]
  ? First extends PromiseLike<infer PromiseValue>
    ? PromiseValue
    : First extends object
    ? Merge<First, ArrayToObject<Rest, R>>
    : ArrayToObject<Rest, R>
  : R;

export type AsyncFunction = (...args: any[]) => Promise<any>;
