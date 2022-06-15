import type {
  BaseBuildConfig,
  BundlelessOptions,
  BundleOptions,
} from '../../schema/types';

export type NormalizedBuildConfig =
  | NormalizedBundleBuildConfig
  | NormalizedBundlelessBuildConfig;

export type CommonNormalizedBuildConfig = Required<
  Pick<
    BaseBuildConfig,
    'tsconfig' | 'outputPath' | 'format' | 'target' | 'enableDts' | 'dtsOnly'
  >
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
    bundlelessOptions: BundlelessOptions;
    // Compatible field, to be removed in the next release, not visible to users
    outputStylePath?: string;
  };
