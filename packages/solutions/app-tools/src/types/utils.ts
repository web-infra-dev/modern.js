export type UnwrapBuilderConfig<
  Config,
  Key extends keyof Config,
> = Required<Config>[Key];

export type Bundler = 'rspack' | 'webpack' | 'shared';

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
> = B extends 'shared'
  ? Config['shared']
  : B extends 'rspack'
    ? Config['rspack']
    : Config['webpack'];

export interface DevToolData<DevOptions = any> {
  name: string;
  subCommands?: string[];
  menuItem?: {
    name: string;
    value: string;
  };
  // TODO: build watch
  // disableRunBuild?: boolean;
  action: (
    options: DevOptions,
    context: { isTsProject?: boolean },
  ) => void | Promise<void>;
}

export interface RegisterBuildPlatformResult {
  platform: string | string[];
  build: (
    currentPlatform: string,
    context: { isTsProject: boolean },
  ) => void | Promise<void>;
}
