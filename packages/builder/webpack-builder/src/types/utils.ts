export type JSONPrimitive = string | number | boolean | null;

export type JSONArray = Array<JSONValue>;

export type JSONObject = { [key: string]: JSONValue };

export type JSONValue = JSONPrimitive | JSONObject | JSONArray;

export type ArrayOrNot<T> = T | T[];

export type ChainedConfig<Config, Utils = unknown> = ArrayOrNot<
  | Config
  | (keyof Utils extends never
      ? (config: Config) => Config | void
      : (config: Config, utils?: Utils) => Config | void)
>;

export type KeysExtending<T extends object, V> = {
  [K in keyof T]-?: T[K] extends V ? K : never;
}[keyof T];

export type PickObjects<T extends Record<any, any>> = Pick<
  T,
  KeysExtending<T, Record<any, any>>
>;

/**
 * Deeply modify optional object props to required.
 * Usually used to fill default config with required props.
 */
export type DeepFillObjectBy<T extends object, P extends T> = {
  [K in keyof T & keyof PickObjects<P>]-?: Exclude<
    Exclude<T[K], undefined> extends object
      ? unknown &
          DeepFillObjectBy<Exclude<T[K], undefined>, Exclude<P[K], undefined>>
      : T[K],
    undefined
  >;
} & {
  [K in Exclude<keyof T, keyof PickObjects<P>>]: T[K] extends Record<any, any>
    ? unknown & DeepFillObjectBy<T[K], P[K]>
    : T[K];
};
