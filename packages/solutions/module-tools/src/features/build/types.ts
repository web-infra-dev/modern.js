import { BuildConfig, BundlelessOptions } from '../../schema/types';

export type NormalizedBuildConfig =
  | NormalizedBundleBuildConfig
  | NormalizedBundlelessBuildConfig;

export type NormalizedBundleBuildConfig = Required<Omit<BuildConfig, 'bundlelessOptions'>> & {
  watch: boolean;
}
export type NormalizedBundlelessBuildConfig = Required<
  Omit<BuildConfig, 'bundleOptions'>
> &
  Pick<BuildConfig, 'bundleOptions'> & {
    bundlelessOptions: Required<BundlelessOptions>;
    // Compatible field, to be removed in the next release, not visible to users
    ignoreSingleFormatDir?: boolean;
    outputStylePath?: string;
    watch: boolean;
  };
