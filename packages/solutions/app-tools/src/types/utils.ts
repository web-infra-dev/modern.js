// eslint-disable-next-line eslint-comments/disable-enable-pair
/* eslint-disable @typescript-eslint/ban-types */
export type UnwrapBuilderConfig<
  Config,
  Key extends keyof Config,
> = Required<Config>[Key];

export type Bundler = 'rspack' | 'webpack' | undefined;

export type FromConfig<
  B extends Bundler,
  Config extends {
    rspack: Rspack;
    webpack: Webpack;
    shared: Shared;
  },
  Rspack = {},
  Webpack = {},
  Shared = {},
> = B extends undefined
  ? Config['shared']
  : B extends 'rspack'
  ? Config['rspack']
  : Config['webpack'];
