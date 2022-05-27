import { BuildConfig, BundleOption } from '../../schema/types';

export type NormalizedBuildConfig =
  | NormalizedBundleBuildConfig
  | NormalizedBundlessBuildConfig;

export type NormalizedBundleBuildConfig = Required<BuildConfig> & {
  bundle: true;
  bundleOption: Required<BundleOption>;
};
export type NormalizedBundlessBuildConfig = Required<
  Omit<BuildConfig, 'bundleOption'>
> &
  Pick<BuildConfig, 'bundleOption'>;
