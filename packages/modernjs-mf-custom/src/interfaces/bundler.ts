import type { AppTools, Bundler, UserConfig } from '@modern-js/app-tools';

type AppToolsUserConfig<T extends Bundler> = AppTools<T>['userConfig']['tools'];

type ExcludeUndefined<T> = T extends undefined ? never : T;

type ExtractObjectType<T> = T extends (...args: any[]) => any ? never : T;

type OmitArrayConfiguration<T> =
  T extends Array<any> ? (T extends (infer U)[] ? U : T) : ExtractObjectType<T>;

type WebpackConfigs =
  ExcludeUndefined<AppToolsUserConfig<'webpack'>> extends { webpack?: infer U }
    ? U
    : never;
type ObjectWebpack = ExtractObjectType<OmitArrayConfiguration<WebpackConfigs>>;

type RspackConfigs =
  ExcludeUndefined<AppToolsUserConfig<'rspack'>> extends { rspack?: infer U }
    ? U
    : never;
type ObjectRspack = ExtractObjectType<OmitArrayConfiguration<RspackConfigs>>;

type BundlerChain = ExcludeUndefined<
  ExcludeUndefined<UserConfig<AppTools>['tools']>['bundlerChain']
>;

type BundlerChainFunc = Extract<BundlerChain, (chain: any, utils: any) => any>;

export type BundlerChainConfig = Parameters<BundlerChainFunc>[0];

export type BundlerConfig<T extends Bundler> = T extends 'rspack'
  ? ObjectRspack
  : ObjectWebpack;
