export type UnwrapBuilderConfig<
  Config,
  Key extends keyof Config,
> = Required<Config>[Key];
