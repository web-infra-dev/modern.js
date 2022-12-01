export type DesignSystem = Record<string, any> & {
  supportStyledComponents?: boolean;
};

export type Tailwind =
  | Record<string, any>
  | ((options: Record<string, any>) => Record<string, any> | void);
