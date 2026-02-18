import type { AppUserConfig } from '@modern-js/app-tools';

type AppToolsUserConfig = AppUserConfig['tools'];

type ExcludeUndefined<T> = T extends undefined ? never : T;

type ExtractObjectType<T> = T extends (...args: any[]) => any ? never : T;

type OmitArrayConfiguration<T> = T extends Array<any>
  ? T extends (infer U)[]
    ? U
    : T
  : ExtractObjectType<T>;

type RspackConfigs = ExcludeUndefined<AppToolsUserConfig> extends {
  rspack?: infer U;
}
  ? U
  : never;

type ObjectRspack = ExtractObjectType<OmitArrayConfiguration<RspackConfigs>>;

type BundlerChain = ExcludeUndefined<AppUserConfig['tools']>['bundlerChain'];

type BundlerChainFunc = Extract<BundlerChain, (chain: any, utils: any) => any>;

export type BundlerChainConfig = Parameters<BundlerChainFunc>[0];

export type BundlerConfig = ObjectRspack;
