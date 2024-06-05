type ArrayOrNot<T> = T | T[];

export type ConfigChain<Config, Utils = unknown> = ArrayOrNot<
  | Config
  | (keyof Utils extends never
      ? (config: Config) => Config | void
      : (config: Config, utils: Utils) => Config | void)
>;
