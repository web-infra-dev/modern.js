export type TailwindConfig = Record<string, any>;

export type ExtraTailwindConfig =
  | TailwindConfig
  | ((options: TailwindConfig) => TailwindConfig | void);
