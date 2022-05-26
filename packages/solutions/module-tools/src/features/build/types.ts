import { BuildConfig, BundleOption } from '../../schema/types';

export type NormalizedBuildConfig = Required<BuildConfig> & {
  bundleOption: Required<BundleOption>;
};

export type TaskBuildConfig = NormalizedBuildConfig;
