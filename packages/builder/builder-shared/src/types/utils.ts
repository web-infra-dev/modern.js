export type JSONPrimitive = string | number | boolean | null;

export type JSONArray = Array<JSONValue>;

export type JSONObject = { [key: string]: JSONValue };

export type JSONValue = JSONPrimitive | JSONObject | JSONArray;

export type ArrayOrNot<T> = T | T[];

export type PromiseOrNot<T> = T | Promise<T>;

export type NodeEnv = 'development' | 'production' | 'test';

export type ChainedConfig<Config, Utils = unknown> = ArrayOrNot<
  | Config
  | (keyof Utils extends never
      ? (config: Config) => Config | void
      : (config: Config, utils: Utils) => Config | void)
>;

export type DeepReadonly<T> = keyof T extends never
  ? T
  : { readonly [k in keyof T]: DeepReadonly<T[k]> };
