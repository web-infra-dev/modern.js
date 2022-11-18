import type { BuilderConfig } from '@modern-js/builder-webpack-provider';
import type { Merge } from '@modern-js/types';
import type { BaseJestUserConfig } from './testing';

export type BuilderToolsConfig = Required<BuilderConfig>['tools'];

/**
 * The configuration of `tools.tailwindcss` is provided by `tailwindcss` plugin.
 * Please use `yarn new` or `pnpm new` to enable the corresponding capability.
 * @requires `tailwindcss` plugin
 */
export type Tailwindcss =
  | Record<string, any>
  | ((options: Record<string, any>) => Record<string, any> | void);

export type BaseToolsUserConfig<ExtendsToolsUserConfig> = Merge<
  Pick<BuilderToolsConfig, 'babel' | 'less' | 'sass' | 'postcss'> & {
    tailwindcss?: Tailwindcss;
    jest?: BaseJestUserConfig;
  },
  ExtendsToolsUserConfig
>;

export type BaseToolsNormalizedConfig<ExtendToolsNormailzedConfig> =
  BaseToolsUserConfig<ExtendToolsNormailzedConfig>;
