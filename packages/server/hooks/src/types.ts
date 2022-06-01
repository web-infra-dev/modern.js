import { Merge } from 'type-fest';

export enum HttpMetadata {
  METHOD = 'Http_Method',
  Data = 'Http_Data',
  QUERY = 'Http_Query',
  PARAMS = 'Http_Params',
  HEADERS = 'Http_Headers',
  RESPONSE = 'Http_Response',
}

export type InputSchemaMeata = Extract<
  HttpMetadata,
  | HttpMetadata.Data
  | HttpMetadata.QUERY
  | HttpMetadata.HEADERS
  | HttpMetadata.PARAMS
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
  validate: ValidateFunc;
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
