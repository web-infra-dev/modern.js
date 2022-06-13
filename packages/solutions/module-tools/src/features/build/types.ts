import { BuildConfig, BundlessOption } from '../../schema/types';

export type NormalizedBuildConfig =
  | NormalizedBundleBuildConfig
  | NormalizedBundlelessBuildConfig;

export type NormalizedBundleBuildConfig = Required<BuildConfig> & {
  watch: boolean;
}
export type NormalizedBundlelessBuildConfig = Required<
  Omit<BuildConfig, 'bundleOption'>
> &
  Pick<BuildConfig, 'bundleOption'> & {
    bundlessOption: Required<BundlessOption>;
    // Compatible field, to be removed in the next release, not visible to users
    ignoreSingleFormatDir?: boolean;
    outputStylePath?: string;
    watch: boolean;
  };
