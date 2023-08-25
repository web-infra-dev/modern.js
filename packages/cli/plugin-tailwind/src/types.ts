export type DesignSystem = TailwindConfig & {
  supportStyledComponents?: boolean;
};

export type TailwindConfig = Record<string, any>;

export type ExtraTailwindConfig =
  | TailwindConfig
  | ((options: TailwindConfig) => TailwindConfig | void);
