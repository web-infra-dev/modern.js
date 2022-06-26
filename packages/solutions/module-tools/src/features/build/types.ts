import type {
  BaseBuildConfig,
  BundlelessOptions,
  BundleOptions,
} from '../../schema/types';

export type NormalizedBuildConfig =
  | NormalizedBundleBuildConfig
  | NormalizedBundlelessBuildConfig;

export type CommonNormalizedBuildConfig = Required<
  Omit<BaseBuildConfig, 'bundleOptions' | 'bundlelessOptions'>
> & {
  watch?: boolean;
};

export type NormalizedBundleBuildConfig = {
  buildType: 'bundle';
} & CommonNormalizedBuildConfig & {
    bundleOptions: BundleOptions;
  };
export type NormalizedBundlelessBuildConfig = {
  buildType: 'bundleless';
} & CommonNormalizedBuildConfig & {
    bundlelessOptions: Required<BundlelessOptions>;
  };
