export type JSONPrimitive = string | number | boolean | null;

export type JSONArray = Array<JSONValue>;

export type JSONObject = { [key: string]: JSONValue };

export type JSONValue = JSONPrimitive | JSONObject | JSONArray;

export type ArrayOrNot<T> = T | T[];

export type ChainedConfig<Config, Utils = unknown> = ArrayOrNot<
  | Config
  | (keyof Utils extends never
      ? (config: Config) => Config | void
      : (config: Config, utils: Utils) => Config | void)
>;

export type DeepRequired<T> = unknown & {
  [K in keyof T]-?: DeepRequired<T[K]>;
};

export type DeepPartial<T> = unknown & {
  [K in keyof T]?: DeepPartial<T[K]>;
};
