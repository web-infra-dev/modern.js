import { BuildConfig, BundleOption, BundlessOption } from '../../schema/types';

export type NormalizedBuildConfig =
  | NormalizedBundleBuildConfig
  | NormalizedBundlessBuildConfig;

export type NormalizedBundleBuildConfig = Required<
  Omit<BuildConfig, 'bundlessOption'>
> & {
  bundleOption: Required<BundleOption>;
};
export type NormalizedBundlessBuildConfig = Required<
  Omit<BuildConfig, 'bundleOption'>
> &
  Pick<BuildConfig, 'bundleOption'> & {
    bundlessOption: Required<BundlessOption>;
  };
