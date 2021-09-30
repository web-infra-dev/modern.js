export type Argu<F extends (input: any) => any> = F extends (
  input: infer A,
) => any
  ? A
  : never;
